const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const client = new CosmosClient({ endpoint, key });
const databaseId = process.env.COSMOS_DB_ID;
const containerId = process.env.COSMOS_CON_ID;
const ref_containerId = process.env.COSMOS_CON_ID_TOKEN;

// export const saveToCosmosDB = async (item: any) => {
//     const container = client.database(databaseId).container(containerId);
//     try {
//         const { resource: createdItem } = await container.items.create(item);
//         console.log(`Item created:\n${JSON.stringify(createdItem, null, 2)}`);
//         return createdItem;
//     } catch (error) {
//         const anyError = error as any; // errorをany型にキャスト
//         console.error(`Error creating item: ${anyError.message}`);
//         throw new Error(`Failed to save item to Cosmos DB: ${anyError.message}`);
//     }
// };

interface TokenData {
    oid: string;
    refreshToken: string;
    date: number;
    id: string;
}

export const saveToCosmosDB = async (item: any) => {
    const container = client.database(databaseId).container(containerId);
    try {
        // itemが文字列の場合、オブジェクトに変換
        const { resource: createdItem } = await container.items.create(item);
        // console.log(`Item created:\n${JSON.stringify(createdItem, null, 2)}`);
        return createdItem;
    } catch (error) {
        const anyError = error as any; // errorをany型にキャスト
        console.error(`Error creating item: ${anyError.message}`);
        throw new Error(`Failed to save item to Cosmos DB: ${anyError.message}`);
    }
};

// read
export const readAllItemsFromCosmosDB = async (oid: string | null) => {
    const container = client.database(databaseId).container(containerId);
    try {
        // oidのアイテムを取得するクエリ
        const query = `SELECT * FROM c WHERE c.oid = '${oid}'`;

        const { resources: items } = await container.items.query(query).fetchAll();
        if (items.length > 0) {
            // console.log(`Items found:\n${JSON.stringify(items, null, 2)}`);
            return items;
        } else {
            console.log('No items found in the container.');
            return [];
        }
    } catch (error) {
        const anyError = error as any; // errorをany型にキャスト
        console.error(`Error reading items: ${anyError.message}`);
        throw new Error(`Failed to read items from Cosmos DB: ${anyError.message}`);
    }
};

// update
export const updateItemInCosmosDB = async (uuid: string, updatedData: any) => {
    const container = client.database(databaseId).container(containerId);
    try {

        const querySpec = `SELECT * FROM c WHERE c.id = "${uuid}"`
        const { resources: items } = await container.items.query(querySpec).fetchAll();
        if (items.length === 0) {
            console.log('No item found with the given uuid.');
            // アイテムが見つからなかった場合、新しいアイテムを保存
            return await saveToCosmosDB(updatedData);
        }

        const item = items[0];
        const { id, _etag } = item;

        // アイテムを更新
        const { resource: updatedItem } = await container.item(uuid, undefined).replace(updatedData);
        // console.log("updated",updatedItem)
        // console.log(`Item updated:\n${JSON.stringify(updatedItem, null, 2)}`);

        return updatedItem;
    } catch (error) {
        const anyError = error as any;
        console.error(`Error updating item: ${anyError.message}`);
        throw new Error(`Failed to update item in Cosmos DB: ${anyError.message}`);
    }
};

// oidからのrefreshtokenの取得
export const readrefreshtokenFromCosmosDB = async (oid: string | null) => {
    const container = client.database(databaseId).container(ref_containerId);
    console.log("read_oid",oid)
    try {
        // oidのアイテムを取得するクエリ
        const query =  `SELECT * FROM c WHERE c.oid=${oid}`;
        console.log(query)

        const { resources: items } = await container.items.query(query).fetchAll();
        console.log("items",items)
        if (items.length > 0) {
            // console.log(`Items found:\n${JSON.stringify(items, null, 2)}`);
            return items[0].refreshToken;
        } else {
            console.log('No items found in the container.');
            return [];
        }
    } catch (error) {
        const anyError = error as any; // errorをany型にキャスト
        console.error(`Error reading items: ${anyError.message}`);
        throw new Error(`Failed to read items from Cosmos DB: ${anyError.message}`);
    }
};

// tokenを保存する
export const saveToken = async (item: any) => {
    const container = client.database(databaseId).container(ref_containerId);
    try {
        // itemが文字列の場合、オブジェクトに変換
        const { resource: createdItem } = await container.items.create(item);
        return createdItem;
    } catch (error) {
        const anyError = error as any; // errorをany型にキャスト
        console.error(`Error creating item: ${anyError.message}`);
        throw new Error(`Failed to save item to Cosmos DB: ${anyError.message}`);
    }
};

// tokenをupdateする
export const updateToken = async (oid: string, refreshToken: string, uuid: string) => {
    const container = client.database(databaseId).container(ref_containerId);
    const date = Date.now();
    const tokenData: TokenData = {
        oid: oid,
        refreshToken: refreshToken,
        date: date,
        id: uuid
    };

    try {
        const querySpec = {
            query: "SELECT * FROM c WHERE c.oid = @oid",
            parameters: [
                { name: "@oid", value: oid }
            ]
        };
        const { resources: items } = await container.items.query(querySpec).fetchAll();
        // アイテムが見つからなかった場合、新しいアイテムを保存
        if (items.length === 0) {
            console.log('No item found with the given oid.');
            return await saveToken(tokenData);
        }
        const partitionKey = oid;
        const item = items[0];
        const { id, _etag } = item;
        // アイテムを更新
        const { resource: updatedItem } = await container.item(id, partitionKey).replace(tokenData);

        return updatedItem;
    } catch (error) {
        const anyError = error as any;
        console.error(`Error updating item: ${anyError.message}`);
        throw new Error(`Failed to update item in Cosmos DB: ${anyError.message}`);
    }
};