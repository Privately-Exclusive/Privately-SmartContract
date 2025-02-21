import { BigNumberish } from "ethers";



export class PrivatelyNFT {
    id: BigNumberish;
    title: string;
    author: string;
    url: string;


    constructor(
        id: BigNumberish,
        title: string,
        author: string,
        url: string
    ) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.url = url;
    }


    public static async map(list: BigNumberish[], client: any): Promise<PrivatelyNFT[]> {
        return await Promise.all(list.map(async (id: BigNumberish) => {
            return await client.getData(id);
        }));
    }
}