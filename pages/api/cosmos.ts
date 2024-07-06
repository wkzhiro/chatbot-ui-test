const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const client = new CosmosClient({ endpoint, key });
const databaseId = process.env.COSMOS_DB_ID;
const containerId = process.env.COSMOS_CON_ID;

export const saveToCosmosDB = async (item: any) => {
    const container = client.database(databaseId).container(containerId);
    try {
        const { resource: createdItem } = await container.items.create(item);
        console.log(`Item created:\n${JSON.stringify(createdItem, null, 2)}`);
        return createdItem;
    } catch (error) {
        const anyError = error as any; // errorをany型にキャスト
        console.error(`Error creating item: ${anyError.message}`);
        throw new Error(`Failed to save item to Cosmos DB: ${anyError.message}`);
    }
};