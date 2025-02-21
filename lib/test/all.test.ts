import { describe } from "mocha";
import { auctionSystemTests } from "./auctions.test";
import { coinTests } from "./coin.test";
import { collectionTests } from "./collection.test";



describe("TEST - PrivatelyCoin", coinTests);
describe("TEST - PrivatelyCollection", collectionTests);
describe("TEST - PrivatelyAuctionSystem", auctionSystemTests);
