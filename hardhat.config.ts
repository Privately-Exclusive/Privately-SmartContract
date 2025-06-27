import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";



const config: HardhatUserConfig = {
    solidity: "0.8.28",
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545"
        },
        hardhat: {
            chainId: 31337,
            mining: {
                auto: false,
                interval: 1000
            }
        }

    }
};

export default config;
