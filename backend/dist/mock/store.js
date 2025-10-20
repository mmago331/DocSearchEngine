import bcrypt from "bcryptjs";
import sampleDocuments from "../data/docs.json" assert { type: "json" };
function nowIso() {
    return new Date().toISOString();
}
function toBoolean(value) {
    return value === true || String(value).toLowerCase() === "true";
}
const defaultEmail = process.env.MOCK_USER_EMAIL ?? "demo.user@example.com";
const defaultPassword = process.env.MOCK_USER_PASSWORD ?? "demo1234";
const defaultName = process.env.MOCK_USER_NAME ?? "Demo User";
const defaultIsAdmin = toBoolean(process.env.MOCK_USER_IS_ADMIN ?? false);
const mockUsers = [];
let nextUserId = 1;
const mockDocuments = [];
let nextDocumentId = 1;
function getUserNameById(userId) {
    const user = mockUsers.find((entry) => entry.id === userId);
    return user ? user.name : "Unknown";
}
function countDocumentsForUser(userId) {
    return mockDocuments.filter((doc) => doc.userId === userId).length;
}
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function createInternalUser({ email, name, password, isAdmin }) {
    const normalizedEmail = normalizeEmail(email);
    if (mockUsers.some((user) => user.email === normalizedEmail)) {
        throw new Error("email_in_use");
    }
    const record = {
        id: nextUserId++,
        email: normalizedEmail,
        name: name.trim(),
        passwordHash: bcrypt.hashSync(password, 10),
        isAdmin: Boolean(isAdmin),
        createdAt: nowIso(),
        updatedAt: nowIso(),
    };
    mockUsers.push(record);
    return record;
}
function seedInitialData() {
    const demoUser = createInternalUser({
        email: defaultEmail,
        name: defaultName,
        password: defaultPassword,
        isAdmin: defaultIsAdmin,
    });
    for (const [index, doc] of sampleDocuments.entries()) {
        const contentParts = [doc.title ?? "", doc.summary ?? "", Array.isArray(doc.tags) ? doc.tags.join(" ") : ""];
        const content = contentParts.filter(Boolean).join("\n");
        mockDocuments.push({
            id: nextDocumentId++,
            userId: demoUser.id,
            originalName: doc.title ?? `Sample Document ${index + 1}`,
            fileSize: Math.max(512, (doc.summary ?? "").length * 8),
            fileType: "text/plain",
            isPublic: true,
            createdAt: nowIso(),
            updatedAt: nowIso(),
            content,
            uploaderName: demoUser.name,
        });
    }
}
seedInitialData();
function formatUserForAuth(user) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        is_admin: user.isAdmin,
    };
}
function formatUserForAdmin(user) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        is_admin: user.isAdmin,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        document_count: countDocumentsForUser(user.id),
    };
}
export function getMockUserByEmail(email) {
    const normalized = normalizeEmail(email);
    return mockUsers.find((user) => user.email === normalized) ?? null;
}
export function registerMockUser({ email, password, name }) {
    const record = createInternalUser({
        email,
        name,
        password,
        isAdmin: false,
    });
    return formatUserForAuth(record);
}
export function createMockUser({ email, name, password, isAdmin }) {
    const record = createInternalUser({ email, name, password, isAdmin });
    return formatUserForAdmin(record);
}
export function updateMockUser(id, { email, name, password, isAdmin }) {
    const user = mockUsers.find((entry) => entry.id === id);
    if (!user) {
        return null;
    }
    if (email) {
        const normalizedEmail = normalizeEmail(email);
        if (mockUsers.some((entry) => entry.email === normalizedEmail && entry.id !== id)) {
            throw new Error("email_in_use");
        }
        user.email = normalizedEmail;
    }
    if (name) {
        user.name = name.trim();
    }
    if (password) {
        user.passwordHash = bcrypt.hashSync(password, 10);
    }
    if (typeof isAdmin === "boolean") {
        user.isAdmin = isAdmin;
    }
    user.updatedAt = nowIso();
    return formatUserForAdmin(user);
}
export function deleteMockUser(id) {
    const index = mockUsers.findIndex((user) => user.id === id);
    if (index === -1) {
        return false;
    }
    mockUsers.splice(index, 1);
    for (let i = mockDocuments.length - 1; i >= 0; i -= 1) {
        if (mockDocuments[i].userId === id) {
            mockDocuments.splice(i, 1);
        }
    }
    return true;
}
export function listMockUsers() {
    return mockUsers.map((user) => formatUserForAdmin(user));
}
function formatDocumentForOwner(doc) {
    return {
        id: doc.id,
        original_name: doc.originalName,
        file_size: doc.fileSize,
        file_type: doc.fileType,
        is_public: doc.isPublic,
        created_at: doc.createdAt,
    };
}
function formatDocumentForPublic(doc) {
    return {
        id: doc.id,
        original_name: doc.originalName,
        file_size: doc.fileSize,
        file_type: doc.fileType,
        created_at: doc.createdAt,
        uploader_name: doc.uploaderName,
    };
}
export function listMockDocumentsForUser(userId) {
    return mockDocuments.filter((doc) => doc.userId === userId).map((doc) => formatDocumentForOwner(doc));
}
export function listMockPublicDocuments() {
    return mockDocuments.filter((doc) => doc.isPublic).map((doc) => formatDocumentForPublic(doc));
}
export function createMockDocument({ userId, originalName, isPublic, fileType, fileSize, content }) {
    const record = {
        id: nextDocumentId++,
        userId,
        originalName,
        filename: `mock-upload-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        fileSize,
        fileType,
        isPublic: Boolean(isPublic),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        content: content ?? "",
        uploaderName: getUserNameById(userId),
    };
    mockDocuments.unshift(record);
    return {
        ...formatDocumentForOwner(record),
        filename: record.filename,
    };
}
export function deleteMockDocument(id, userId) {
    const index = mockDocuments.findIndex((doc) => doc.id === id && doc.userId === userId);
    if (index === -1) {
        return false;
    }
    mockDocuments.splice(index, 1);
    return true;
}
function buildSnippet(content, query) {
    if (!content) {
        return "No preview available";
    }
    const haystack = content.toLowerCase();
    const needle = query.toLowerCase();
    const position = haystack.indexOf(needle);
    if (position === -1) {
        return content.slice(0, 200);
    }
    const start = Math.max(0, position - 80);
    const end = Math.min(content.length, position + needle.length + 120);
    return content.slice(start, end);
}
export function searchMockDocuments({ query, filter, userId }) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
        return [];
    }
    const matches = mockDocuments.filter((doc) => {
        if (!doc.content) {
            return false;
        }
        const scopeMatch = (() => {
            if (filter === "my") {
                return doc.userId === userId;
            }
            if (filter === "public") {
                return doc.isPublic;
            }
            if (!userId) {
                return doc.isPublic;
            }
            return doc.userId === userId || doc.isPublic;
        })();
        if (!scopeMatch) {
            return false;
        }
        return doc.content.toLowerCase().includes(normalizedQuery);
    });
    return matches.map((doc, index) => ({
        id: doc.id,
        title: doc.originalName,
        snippet: buildSnippet(doc.content, normalizedQuery) || "No preview available",
        score: Math.max(0.1, 0.95 - index * 0.05),
        filter: doc.userId === userId ? "my" : "public",
        uploader: doc.uploaderName,
        created_at: doc.createdAt,
    }));
}
export function resetMockDocumentsFromSample() {
    mockDocuments.splice(0, mockDocuments.length);
    nextDocumentId = 1;
    const primaryUser = mockUsers[0] ?? createInternalUser({
        email: defaultEmail,
        name: defaultName,
        password: defaultPassword,
        isAdmin: defaultIsAdmin,
    });
    for (const [index, doc] of sampleDocuments.entries()) {
        const contentParts = [doc.title ?? "", doc.summary ?? "", Array.isArray(doc.tags) ? doc.tags.join(" ") : ""];
        const content = contentParts.filter(Boolean).join("\n");
        mockDocuments.push({
            id: nextDocumentId++,
            userId: primaryUser.id,
            originalName: doc.title ?? `Sample Document ${index + 1}`,
            fileSize: Math.max(512, (doc.summary ?? "").length * 8),
            fileType: "text/plain",
            isPublic: true,
            createdAt: nowIso(),
            updatedAt: nowIso(),
            content,
            uploaderName: primaryUser.name,
        });
    }
    return mockDocuments.length;
}
