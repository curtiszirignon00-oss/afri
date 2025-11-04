import prisma from "./prisma"

function maskConnectionString(conn: string | undefined) {
    if (!conn) return "(not set)"
    try {
        // mask password between : and @ in the authority section
        return conn.replace(/:\/\/(.*?):(.*?)@/, "//$1:***@")
    } catch {
        return "(invalid)"
    }
}

export async function connectPrismaDatabase(){
    try {
        await prisma.$connect()
        console.info("✅ Base de données connectée");
    } catch (error: any) {
        const raw = process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.DATABASE || undefined
        const masked = maskConnectionString(raw)
        console.error("Error connecting to the database. Connection string:", masked)
        console.error("Prisma/Mongo error:", error?.message ?? error)
    }
}

export async function disconnectPrismaDatabase(){
    try {
        await prisma.$disconnect()
        console.info("✅ Base de données déconnectée");
    } catch (error) {
        console.error("Error disconnecting from the database:", error)
    }
}