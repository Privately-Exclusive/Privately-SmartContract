export class PrivatelyNFT {
    id: bigint;
    title: string;
    author: string;
    url: string;


    constructor(
        id: bigint,
        title: string,
        author: string,
        url: string
    ) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.url = url;
    }


    public static async map(list: bigint[], client: any): Promise<PrivatelyNFT[]> {
        return await Promise.all(list.map(async (id: bigint) => {
            return await client.getData(id);
        }));
    }
}