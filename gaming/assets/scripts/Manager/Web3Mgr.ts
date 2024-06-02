import { web3Config } from "../config";

const i18n = require("LanguageData");
const Web3 = require("web3/dist/web3.min.js");

const WinEthereum = window["ethereum"];
const WinWeb3 = window["web3"];

export default class Web3Mgr {
  private static _inst: Web3Mgr;
  public static get inst(): Web3Mgr {
    if (!Web3Mgr._inst) {
      Web3Mgr._inst = new Web3Mgr();
    }
    return Web3Mgr._inst;
  }

  protected _network: string = null;
  public get Network() {
    return this._network;
  }
  public set Network(value: string) {
    this._network = value;
  }

  protected _networkMain: string = null;
  public get NetworkMain() {
    return this._networkMain;
  }
  public set NetworkMain(value: string) {
    this._networkMain = value;
  }

  protected _wallet: string = null;
  public get Wallet() {
    return this._wallet;
  }
  public set Wallet(value: string) {
    this._wallet = value;
  }

  protected _address: string = null;
  public get Address() {
    return this._address;
  }
  public set Address(value: string) {
    this._address = value;
  }

  private web3Provider;
  private web3;

  private GameContract;
  private VerifyContract;
  private _lastProof;

  private currentAccount;

  async selectNetwork(network: string, networkMain: string) {
    let oldNetwork = this._network;
    this._network = network;
    this._networkMain = networkMain;

    let wallet = this._wallet;
    let address = this._address;
    let isWalletAndAddressSelected =
      wallet != null && wallet != "" && address != null && address != "";
    if(isWalletAndAddressSelected && oldNetwork != network) {
      if(wallet == "MetaMask") {
        let newNetwork = web3Config[network];
        if(newNetwork != null) {
          await this.initMetaMaskWeb3((addr) => {
            // const address = "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59";
            this._address = addr.slice(0, 6) + "..." + addr.slice(-4);
          })
        } else {
          alert('Sorry, the game does not support this network！')
        }
      }
    }

  }

  async selectAddress(wallet: string) {
    this._wallet = wallet;
    if(wallet == "MetaMask") {
      await this.initMetaMaskWeb3((addr) => {
        // const address = "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59";
        this._address = addr.slice(0, 6) + "..." + addr.slice(-4);
      })
    }
    
  }

  async initMetaMaskWeb3(callback: Function) {
    let isNetworkSelected =
          this._network != null &&
          this._network != "" &&
          this._networkMain != null &&
          this._networkMain != "";
    if(!isNetworkSelected) return;

    let my = this;
    let checkMetaMaskFlag = await this.checkMetaMask();
    if (checkMetaMaskFlag) {
      let config = web3Config[this._network];
      if(config == null) return;

      let switchFlag = await this.switch(config);
      if (switchFlag) {
        let setWeb3ProviderFlag = await this.setWeb3Provider(config);
        if (setWeb3ProviderFlag) {
          console.log(this.web3Provider);
          this.web3 = await new Web3(this.web3Provider);

          let accounts = await this.web3.eth.getAccounts();
          console.log(accounts);
          if (accounts.length == 0) {
            return;
          }
          this.currentAccount = accounts[0];
          await this.web3.eth.getBalance(accounts[0],async (err, wei) => {
            if (!err) {
              let balance = my.web3.utils.fromWei(wei, "ether");
              console.log("balance:", balance);
              console.log("web3Provider:", my.web3Provider);
              console.log("web3:", my.web3);
              // TODO: initContracts
              callback(accounts[0]);
            }
          });
          WinEthereum.on("accountsChanged", function (accounts) {
            if (accounts.length == 0) {
              return;
            }
            console.log(accounts[0]);
            my.currentAccount = accounts[0];
            callback(accounts[0]);
            my.web3.eth.getBalance(accounts[0], (err, wei) => {
              if (!err) {
                let balance = my.web3.utils.fromWei(wei, "ether");
                console.log("balance:", balance);
              }
            });
          });
          WinEthereum.on('networkChanged', function(networkId){
            console.log('networkChanged',networkId);
            // TODO: change network
          });
        } else {
          console.log("setWeb3Provider error");
        }
      } else {
        console.log("switch chain failed");
      }
    } else {
      console.log("checkMetaMask error");
    }
  }



  // metamask

  async checkMetaMask() {
    if (WinEthereum) {
      if (typeof WinEthereum !== "undefined") {
        console.log("MetaMask is installed!");
        return true;
      } else {
        console.log("MetaMask is not installed!");
        return false;
      }
    } else {
      return false;
    }
  }

  async setWeb3Provider(config) {
    if (WinEthereum) {
      this.web3Provider = WinEthereum;
      try {
        await WinEthereum.enable();
      } catch (error) {
        console.error("User denied account access");
        return false;
      }
    } else if (WinWeb3) {
      this.web3Provider = WinWeb3.currentProvider;
    } else {
      this.web3Provider = new Web3.providers.HttpProvider(config.rpcUrls[0]);
    }
    return true;
  }

  async switch(config) {
    console.log(WinEthereum.chainId);
    if (WinEthereum.chainId == config.chainId) {
      return true;
    }
    return await this.switchChain(config);
  }

  async switchChain(config) {
    try {
      let chainId  = config.chainId;
      await WinEthereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      });
      return true;
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      console.log(switchError);
      if (switchError.code === 4902) {
        return await this.addChain(config);
      }
      return false;
      // handle other "switch" errors
    }
  }

  async addChain(data) {
    try {
      await WinEthereum.request({
        method: "wallet_addEthereumChain",
        params: [data],
      });
      return true;
    } catch (addError) {
      console.log(addError);
      return false;
      // handle "add" error
    }
  }
}
