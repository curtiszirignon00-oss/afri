import prisma from "./prisma"

export async function connectPrismaDatabase(){
    try {
        await prisma.$connect()
        console.info("✅ Base de données connectée");
    } catch (error) {
        console.error("Error connecting to the database:", error)
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