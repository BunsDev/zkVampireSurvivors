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

  selectNetwork(network: string, networkMain: string) {
    this._network = network;
    this._networkMain = networkMain;
  }

  selectAddress(wallet: string) {
    this._wallet = wallet;
    const address = "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59";
    this._address = address.slice(0, 6) + "..." + address.slice(-4);
  }

  async initWeb3() {
    this.checkMetaMask();
    let web3Provider = new Web3.providers.HttpProvider("https://sepolia-rpc.scroll.io");
    let web3 = await new Web3(web3Provider);
    console.log(web3);
  }


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
}
