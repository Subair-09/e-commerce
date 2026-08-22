import express, { Request, Response } from "express";
import path from "path";
import multer from "multer";
import dotenv from "dotenv";
import { 
  BlobServiceClient, 
  StorageSharedKeyCredential, 
  ContainerClient, 
  BlobItem 
} from "@azure/storage-blob";
import { createServer as createViteServer } from "vite";

import { 
  getMongoStatus,
  getCollectionCounts,
  fetchProducts,
  insertProduct,
  updateProductDoc,
  removeProductDoc,
  seedMongoDatabase,
  insertOrder,
  fetchOrders,
  insertSubscriber,
  fetchSubscribers,
  fetchActivityLogs,
  registerMongoUser,
  loginMongoUser,
  loginAdminMongoUser,
  getMongoUserById,
  updateMongoUserProfile,
  fetchUserOrdersByEmail,
  fetchAllCustomersForAdmin,
  updateAdminCustomerDoc,
  updateAdminOrderStatusDoc,
  deleteAdminOrderDoc,
  calculateSalesAnalytics,
  MASTER_ADMIN_EMAIL,
  MASTER_ADMIN_PASSWORD
} from "./server/mongodb";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Configure Multer for in-memory file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
  },
});

// Lazy Azure Blob Service Client factory
let cachedBlobClient: BlobServiceClient | null = null;
let lastAccountName: string = "";

function getAzureBlobServiceClient(): { client: BlobServiceClient | null; accountName: string; error?: string } {
  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (connectionString && connectionString.trim() !== "") {
      // Extract AccountName from connection string for UI display
      const match = connectionString.match(/AccountName=([^;]+)/i);
      const accName = match ? match[1] : "Azure Storage Account";
      if (!cachedBlobClient || lastAccountName !== accName) {
        cachedBlobClient = BlobServiceClient.fromConnectionString(connectionString);
        lastAccountName = accName;
      }
      return { client: cachedBlobClient, accountName: accName };
    }

    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const sasToken = process.env.AZURE_STORAGE_SAS_TOKEN;

    if (accountName && accountKey) {
      if (!cachedBlobClient || lastAccountName !== accountName) {
        const credential = new StorageSharedKeyCredential(accountName, accountKey);
        cachedBlobClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, credential);
        lastAccountName = accountName;
      }
      return { client: cachedBlobClient, accountName };
    }

    if (accountName && sasToken) {
      const cleanSas = sasToken.startsWith("?") ? sasToken : `?${sasToken}`;
      if (!cachedBlobClient || lastAccountName !== accountName) {
        cachedBlobClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net${cleanSas}`);
        lastAccountName = accountName;
      }
      return { client: cachedBlobClient, accountName };
    }

    return { 
      client: null, 
      accountName: "", 
      error: "Azure Storage credentials not configured. Please set AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_NAME & KEY." 
    };
  } catch (err: any) {
    return { client: null, accountName: "", error: err.message || "Failed to initialize Azure Blob Service" };
  }
}

// In-memory fallback mock storage when Azure credentials are not yet supplied
interface MockBlob {
  name: string;
  url: string;
  size: number;
  contentType: string;
  lastModified: string;
  container: string;
}

const inMemoryBlobs: MockBlob[] = [
  {
    name: "hero-summer-collection.jpg",
    url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&fit=crop",
    size: 245800,
    contentType: "image/jpeg",
    lastModified: new Date(Date.now() - 3600000).toISOString(),
    container: "auraassets",
  },
  {
    name: "smart-watch-pro-front.jpg",
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&fit=crop",
    size: 184500,
    contentType: "image/jpeg",
    lastModified: new Date(Date.now() - 7200000).toISOString(),
    container: "auraassets",
  },
  {
    name: "leather-tote-bag.jpg",
    url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&fit=crop",
    size: 312000,
    contentType: "image/jpeg",
    lastModified: new Date(Date.now() - 14400000).toISOString(),
    container: "auraassets",
  },
  {
    name: "catalog-snapshot.json",
    url: "data:application/json;charset=utf-8,{}",
    size: 4890,
    contentType: "application/json",
    lastModified: new Date(Date.now() - 86400000).toISOString(),
    container: "aura-products",
  }
];

// Helper to get or create container safely (without demanding public access, compatible with strict storage account policies)
async function getOrCreateContainerClient(blobServiceClient: BlobServiceClient, containerName: string): Promise<ContainerClient> {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  try {
    const exists = await containerClient.exists();
    if (!exists) {
      // Create without 'access: blob' so accounts with PublicAccessNotPermitted policy don't throw errors
      await containerClient.create();
    }
  } catch (err: any) {
    // If container already exists or cannot be queried directly, proceed with client
    console.warn(`Container init for '${containerName}':`, err?.message || err);
  }
  return containerClient;
}

// ----------------------------------------------------
// API ROUTES FOR AZURE STORAGE
// ----------------------------------------------------

// 0. Safe proxy route to serve blobs with server authentication, bypassing public access restrictions
app.get("/api/storage/file/:container/:blobName(*)", async (req: Request, res: Response) => {
  const container = req.params.container;
  const blobName = req.params.blobName;
  const { client } = getAzureBlobServiceClient();

  const serveFromLocalFallback = () => {
    const found = inMemoryBlobs.find(b => b.container === container && b.name === blobName);
    if (found) {
      if (found.url.startsWith("data:")) {
        const parts = found.url.split(",");
        const mimeMatch = parts[0].match(/data:(.*?);base64/);
        const mimeType = mimeMatch ? mimeMatch[1] : (found.contentType || "application/octet-stream");
        const buffer = Buffer.from(parts[1], "base64");
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Cache-Control", "public, max-age=86400");
        return res.send(buffer);
      }
      return res.redirect(found.url);
    }
    return res.status(404).send("File not found in storage");
  };

  if (!client) {
    return serveFromLocalFallback();
  }

  try {
    const containerClient = client.getContainerClient(container);
    const blobClient = containerClient.getBlobClient(blobName);
    const downloadBlockBlobResponse = await blobClient.download(0);

    if (downloadBlockBlobResponse.contentType) {
      res.setHeader("Content-Type", downloadBlockBlobResponse.contentType);
    } else {
      res.setHeader("Content-Type", "application/octet-stream");
    }

    if (downloadBlockBlobResponse.contentLength) {
      res.setHeader("Content-Length", downloadBlockBlobResponse.contentLength.toString());
    }

    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    if (downloadBlockBlobResponse.readableStreamBody) {
      downloadBlockBlobResponse.readableStreamBody.pipe(res);
    } else {
      serveFromLocalFallback();
    }
  } catch (err: any) {
    // If Azure Storage network or DNS fails (e.g. ENOTFOUND), try serving from in-memory fallback
    const served = serveFromLocalFallback();
    if (!res.headersSent) {
      console.warn(`Streaming fallback used for ${blobName}:`, err?.message || err);
    }
  }
});

// 1. Storage Status & Diagnostics
app.get("/api/storage/status", async (req: Request, res: Response) => {
  const { client, accountName, error } = getAzureBlobServiceClient();
  const defaultContainer = process.env.AZURE_STORAGE_CONTAINER_NAME || "auraassets";

  if (!client) {
    return res.json({
      configured: false,
      mode: "simulation",
      accountName: accountName || "Not Configured",
      defaultContainer,
      message: error || "Azure Storage connection string or account keys not provided.",
      containers: ["auraassets", "aura-products", "aura-orders", "user-uploads"],
    });
  }

  try {
    // Test listing containers to verify real Azure credentials
    const containers: string[] = [];
    for await (const container of client.listContainers()) {
      containers.push(container.name);
    }

    // Auto-create default container if missing
    if (!containers.includes(defaultContainer)) {
      try {
        await getOrCreateContainerClient(client, defaultContainer);
        containers.push(defaultContainer);
      } catch (createErr) {
        console.warn("Could not auto-create container:", createErr);
      }
    }

    res.json({
      configured: true,
      mode: "azure-live",
      accountName,
      defaultContainer,
      containers: containers.length > 0 ? containers : [defaultContainer],
      blobEndpoint: `https://${accountName}.blob.core.windows.net`,
    });
  } catch (liveErr: any) {
    const isDnsError = liveErr?.message?.includes("ENOTFOUND") || liveErr?.code === "ENOTFOUND";
    const helpMessage = isDnsError
      ? `DNS error: '${accountName}.blob.core.windows.net' could not be resolved. Please check the spelling of your Azure Storage Account Name '${accountName}' in your Connection String.`
      : `Azure Storage error: ${liveErr.message}`;

    res.json({
      configured: false,
      mode: "error",
      accountName,
      defaultContainer,
      message: helpMessage,
      containers: [defaultContainer, "aura-products", "aura-orders", "user-uploads"],
    });
  }
});

// 2. List Blobs in Container
app.get("/api/storage/blobs", async (req: Request, res: Response) => {
  const containerName = (req.query.container as string) || process.env.AZURE_STORAGE_CONTAINER_NAME || "auraassets";
  const { client, accountName } = getAzureBlobServiceClient();

  if (!client) {
    // Return in-memory items filtered by container
    const filtered = inMemoryBlobs.filter(b => b.container === containerName || containerName === "all");
    return res.json({
      success: true,
      mode: "simulation",
      container: containerName,
      blobs: filtered,
    });
  }

  try {
    const containerClient = await getOrCreateContainerClient(client, containerName);
    const blobs: Array<{
      name: string;
      url: string;
      size: number;
      contentType?: string;
      lastModified: string;
      container: string;
    }> = [];

    for await (const blob of containerClient.listBlobsFlat({
      includeMetadata: true,
    })) {
      const proxyUrl = `/api/storage/file/${encodeURIComponent(containerName)}/${encodeURIComponent(blob.name)}`;
      blobs.push({
        name: blob.name,
        url: proxyUrl,
        size: blob.properties.contentLength || 0,
        contentType: blob.properties.contentType,
        lastModified: blob.properties.lastModified?.toISOString() || new Date().toISOString(),
        container: containerName,
      });
    }

    res.json({
      success: true,
      mode: "azure-live",
      container: containerName,
      blobs,
    });
  } catch (err: any) {
    console.warn(`Azure listing failed for container '${containerName}' (${err?.message}). Falling back to local catalog blobs.`);
    const filtered = inMemoryBlobs.filter(b => b.container === containerName || containerName === "all");
    res.json({
      success: true,
      mode: "fallback",
      container: containerName,
      blobs: filtered,
      notice: `Azure storage query note: ${err.message}`,
    });
  }
});

// 3. Upload File to Azure Blob Storage
app.post("/api/storage/upload", upload.single("file"), async (req: Request, res: Response) => {
  const containerName = (req.body.container as string) || process.env.AZURE_STORAGE_CONTAINER_NAME || "auraassets";
  const customFileName = req.body.fileName as string;

  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file uploaded in form data 'file'." });
  }

  const file = req.file;
  const timestamp = Date.now();
  const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
  const blobName = customFileName 
    ? customFileName.replace(/[^a-zA-Z0-9.-]/g, "_")
    : `${timestamp}-${sanitizedOriginal}`;

  const { client, accountName } = getAzureBlobServiceClient();

  if (!client) {
    // Store in mock memory storage (create base64 data URL for preview if small)
    const base64Data = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    const newMockBlob: MockBlob = {
      name: blobName,
      url: base64Data,
      size: file.size,
      contentType: file.mimetype,
      lastModified: new Date().toISOString(),
      container: containerName,
    };
    inMemoryBlobs.unshift(newMockBlob);

    return res.json({
      success: true,
      mode: "simulation",
      message: "Uploaded to in-memory asset storage (Azure credentials not configured yet).",
      blob: newMockBlob,
    });
  }

  try {
    const containerClient = await getOrCreateContainerClient(client, containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload buffer directly to Azure Block Blob
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype,
        blobCacheControl: "public, max-age=31536000",
      },
    });

    const blobProxyUrl = `/api/storage/file/${encodeURIComponent(containerName)}/${encodeURIComponent(blobName)}`;

    res.json({
      success: true,
      mode: "azure-live",
      message: "File successfully uploaded to Azure Storage Account.",
      blob: {
        name: blobName,
        url: blobProxyUrl,
        size: file.size,
        contentType: file.mimetype,
        lastModified: new Date().toISOString(),
        container: containerName,
      },
    });
  } catch (err: any) {
    const isDnsError = err?.message?.includes("ENOTFOUND") || err?.code === "ENOTFOUND";
    console.warn("Azure Blob Upload notice:", isDnsError ? `DNS lookup failed for storage host. Falling back to local storage buffer.` : err.message);

    // Graceful fallback to in-memory data URL so client workflow is never blocked
    const base64Data = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    const fallbackBlob: MockBlob = {
      name: blobName,
      url: base64Data,
      size: file.size,
      contentType: file.mimetype,
      lastModified: new Date().toISOString(),
      container: containerName,
    };
    inMemoryBlobs.unshift(fallbackBlob);

    res.json({
      success: true,
      mode: "fallback",
      message: isDnsError 
        ? `Image uploaded and preserved locally. Note: Azure storage account '${accountName}' DNS could not be resolved (check account name spelling in Settings).`
        : `Image uploaded with local backup (Azure note: ${err.message})`,
      blob: fallbackBlob,
    });
  }
});

// 4. Delete Blob from Azure Storage
app.delete("/api/storage/blob", async (req: Request, res: Response) => {
  const containerName = (req.query.container as string) || (req.body.container as string) || "auraassets";
  const blobName = (req.query.name as string) || (req.body.name as string);

  if (!blobName) {
    return res.status(400).json({ success: false, error: "Blob name is required." });
  }

  const { client } = getAzureBlobServiceClient();

  const removeLocalBlob = () => {
    const idx = inMemoryBlobs.findIndex(b => b.name === blobName && (b.container === containerName || containerName === "all"));
    if (idx !== -1) {
      inMemoryBlobs.splice(idx, 1);
    }
  };

  if (!client) {
    removeLocalBlob();
    return res.json({
      success: true,
      mode: "simulation",
      message: `Blob '${blobName}' deleted from simulation storage.`,
    });
  }

  try {
    const containerClient = client.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);
    await blobClient.deleteIfExists();
    removeLocalBlob();

    res.json({
      success: true,
      mode: "azure-live",
      message: `Blob '${blobName}' deleted successfully from Azure Storage container '${containerName}'.`,
    });
  } catch (err: any) {
    removeLocalBlob();
    res.json({
      success: true,
      mode: "fallback",
      message: `Blob '${blobName}' removed locally (Azure note: ${err.message}).`,
    });
  }
});

// 5. Backup Order / Checkout Receipts to Azure Blob Storage
app.post("/api/storage/orders/backup", async (req: Request, res: Response) => {
  const orderData = req.body;
  if (!orderData || !orderData.orderId) {
    return res.status(400).json({ success: false, error: "Invalid order data payload." });
  }

  const containerName = "aura-orders";
  const blobName = `order-${orderData.orderId}-${Date.now()}.json`;
  const jsonContent = JSON.stringify(orderData, null, 2);
  const buffer = Buffer.from(jsonContent, "utf-8");

  const { client } = getAzureBlobServiceClient();

  const storeLocalOrderBackup = () => {
    const fallbackItem = {
      name: blobName,
      url: `data:application/json;charset=utf-8,${encodeURIComponent(jsonContent)}`,
      size: buffer.length,
      contentType: "application/json",
      lastModified: new Date().toISOString(),
      container: containerName,
    };
    inMemoryBlobs.unshift(fallbackItem);
    return fallbackItem;
  };

  if (!client) {
    storeLocalOrderBackup();
    return res.json({
      success: true,
      mode: "simulation",
      message: `Order receipt '${blobName}' stored in local backup.`,
      blobName,
      container: containerName,
    });
  }

  try {
    const containerClient = await getOrCreateContainerClient(client, containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: "application/json",
      },
    });

    res.json({
      success: true,
      mode: "azure-live",
      message: `Order receipt '${blobName}' secured in Azure Storage container '${containerName}'.`,
      blobName,
      url: blockBlobClient.url,
      container: containerName,
    });
  } catch (err: any) {
    storeLocalOrderBackup();
    res.json({
      success: true,
      mode: "fallback",
      message: `Order receipt saved in local storage (Azure note: ${err.message}).`,
      blobName,
      container: containerName,
    });
  }
});

// 6. Sync Catalog Snapshot to Azure Blob Storage
app.post("/api/storage/catalog/sync", async (req: Request, res: Response) => {
  const { products, categories } = req.body;
  const containerName = "aura-products";
  const blobName = "catalog-latest.json";
  const payload = JSON.stringify({
    syncedAt: new Date().toISOString(),
    itemCount: Array.isArray(products) ? products.length : 0,
    products,
    categories,
  }, null, 2);
  const buffer = Buffer.from(payload, "utf-8");

  const { client } = getAzureBlobServiceClient();

  if (!client) {
    const idx = inMemoryBlobs.findIndex(b => b.name === blobName && b.container === containerName);
    const newBlob: MockBlob = {
      name: blobName,
      url: `data:application/json;charset=utf-8,${encodeURIComponent(payload)}`,
      size: buffer.length,
      contentType: "application/json",
      lastModified: new Date().toISOString(),
      container: containerName,
    };
    if (idx >= 0) inMemoryBlobs[idx] = newBlob;
    else inMemoryBlobs.unshift(newBlob);

    return res.json({
      success: true,
      mode: "simulation",
      message: "Catalog synced to in-memory backup storage.",
      blob: newBlob,
    });
  }

  try {
    const containerClient = await getOrCreateContainerClient(client, containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: "application/json",
      },
    });

    res.json({
      success: true,
      mode: "azure-live",
      message: "Catalog snapshot successfully synchronized to Azure Storage Account.",
      url: blockBlobClient.url,
      blobName,
      container: containerName,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Failed to sync catalog to Azure: ${err.message}`,
    });
  }
});

// ----------------------------------------------------
// API ROUTES FOR MONGODB DATABASE
// ----------------------------------------------------

// 1. MongoDB Status & Diagnostics
app.get("/api/mongo/status", async (req: Request, res: Response) => {
  try {
    const status = await getMongoStatus();
    const counts = await getCollectionCounts();
    res.json({
      success: true,
      status,
      counts,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to retrieve MongoDB status",
    });
  }
});

// 2. Query Products from MongoDB
app.get("/api/mongo/products", async (req: Request, res: Response) => {
  try {
    const { category, search, minPrice, maxPrice, tag, sortBy } = req.query;
    const products = await fetchProducts({
      category: category as string,
      search: search as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      tag: tag as string,
      sortBy: sortBy as string,
    });
    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Create Product in MongoDB
app.post("/api/mongo/products", async (req: Request, res: Response) => {
  try {
    const product = await insertProduct(req.body);
    res.status(201).json({
      success: true,
      message: `Product '${product.name}' created in MongoDB`,
      product,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Update Product in MongoDB
app.put("/api/mongo/products/:id", async (req: Request, res: Response) => {
  try {
    const updated = await updateProductDoc(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    res.json({
      success: true,
      message: `Product '${req.params.id}' updated in MongoDB`,
      product: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Delete Product from MongoDB
app.delete("/api/mongo/products/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await removeProductDoc(req.params.id);
    res.json({
      success: deleted,
      message: deleted ? `Product '${req.params.id}' deleted from MongoDB` : "Product not found",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Seed / Reset MongoDB Catalog
app.post("/api/mongo/seed", async (req: Request, res: Response) => {
  try {
    const { products, categories } = req.body;
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ success: false, error: "Products array is required for seeding" });
    }
    const result = await seedMongoDatabase(products, categories || []);
    res.json({
      success: true,
      message: `Successfully seeded MongoDB with ${result.productsCount} products and ${result.categoriesCount} categories.`,
      result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Orders Management
app.get("/api/mongo/orders", async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const orders = await fetchOrders(limit);
    res.json({ success: true, count: orders.length, orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/mongo/orders", async (req: Request, res: Response) => {
  try {
    const order = await insertOrder(req.body);
    res.status(201).json({
      success: true,
      message: `Order #${order.orderId} recorded in MongoDB`,
      order,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Newsletter Subscribers
app.post("/api/mongo/subscribers", async (req: Request, res: Response) => {
  try {
    const { email, source } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email is required" });
    const sub = await insertSubscriber(email, source);
    res.json({
      success: true,
      message: "Subscribed successfully and stored in MongoDB",
      subscriber: sub,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/mongo/subscribers", async (req: Request, res: Response) => {
  try {
    const subs = await fetchSubscribers();
    res.json({ success: true, count: subs.length, subscribers: subs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Activity Logs
app.get("/api/mongo/logs", async (req: Request, res: Response) => {
  try {
    const logs = await fetchActivityLogs(30);
    res.json({ success: true, count: logs.length, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// AUTHENTICATION & CUSTOMER PROFILE ROUTES (MongoDB)
// ----------------------------------------------------

// 1. Customer Registration
app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;
    const result = await registerMongoUser({ name, email, password, phone });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.status(201).json({
      success: true,
      message: "Customer account created successfully!",
      user: result.user,
      token: result.token,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Registration failed" });
  }
});

// 2. Customer / General Sign In
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await loginMongoUser(email, password);

    if (!result.success) {
      return res.status(401).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      message: result.user?.role === "admin" ? "Master Administrator authenticated!" : "Signed in successfully!",
      user: result.user,
      token: result.token,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Sign in failed" });
  }
});

// 2b. Dedicated Administrator Portal Sign In
app.post("/api/auth/admin-login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await loginAdminMongoUser(email, password);

    if (!result.success) {
      return res.status(401).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      message: "Master Administrator access granted!",
      user: result.user,
      token: result.token,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Admin authentication failed" });
  }
});

// 3. Current User Profile (by Token or Session Id)
app.get("/api/auth/me", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = "";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const tokenString = authHeader.substring(7);
        const payload = JSON.parse(Buffer.from(tokenString, "base64").toString("utf-8"));
        if (payload.exp && payload.exp > Date.now()) {
          userId = payload.userId;
        }
      } catch (_) {}
    }

    if (!userId && req.query.userId) {
      userId = req.query.userId as string;
    }

    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const user = await getMongoUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Update Profile
app.put("/api/auth/profile", async (req: Request, res: Response) => {
  try {
    const { userId, name, phone, addresses, vipTier, vipPoints } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }

    const result = await updateMongoUserProfile(userId, {
      name,
      phone,
      addresses,
      vipTier,
      vipPoints,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({ success: true, message: "Profile updated successfully", user: result.user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Customer Order History
app.get("/api/auth/orders", async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ success: false, error: "Customer email is required" });
    }

    const orders = await fetchUserOrdersByEmail(email);
    res.json({ success: true, count: orders.length, orders });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// DEDICATED ADMIN DASHBOARD API ROUTES
// (Products, Orders, Customers, Sales/Reports)
// ----------------------------------------------------

// 1. Admin - Get All Customers
app.get("/api/admin/customers", async (req: Request, res: Response) => {
  try {
    const customers = await fetchAllCustomersForAdmin();
    res.json({ success: true, count: customers.length, customers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Admin - Update Customer (VIP Tier, Points, Status)
app.put("/api/admin/customers/:id", async (req: Request, res: Response) => {
  try {
    const { name, phone, vipTier, vipPoints, status } = req.body;
    const result = await updateAdminCustomerDoc(req.params.id, {
      name,
      phone,
      vipTier,
      vipPoints: Number(vipPoints),
      status,
    });
    if (!result.success) {
      return res.status(404).json({ success: false, error: result.error });
    }
    res.json({ success: true, message: `Customer #${req.params.id} updated successfully` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Admin - Update Order Status & Courier/Tracking
app.put("/api/admin/orders/:id/status", async (req: Request, res: Response) => {
  try {
    const { status, trackingNumber, courier, notes } = req.body;
    const result = await updateAdminOrderStatusDoc(req.params.id, status, { trackingNumber, courier, notes });
    if (!result.success) {
      return res.status(404).json({ success: false, error: result.error });
    }
    res.json({ success: true, message: `Order #${req.params.id} status updated to ${status}`, order: result.order });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Admin - Delete Order
app.delete("/api/admin/orders/:id", async (req: Request, res: Response) => {
  try {
    const deleted = await deleteAdminOrderDoc(req.params.id);
    res.json({
      success: deleted,
      message: deleted ? `Order #${req.params.id} deleted successfully` : "Order not found",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Admin - Sales & Analytics Report
app.get("/api/admin/sales-analytics", async (req: Request, res: Response) => {
  try {
    const timeframe = (req.query.timeframe as string) || "30d";
    const report = await calculateSalesAnalytics(timeframe);
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// VITE MIDDLEWARE & SERVER STARTUP
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AURA Storefront & Azure Storage Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
