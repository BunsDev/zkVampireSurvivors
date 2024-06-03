import { BEARER_TOKEN, timeValidator_CIRCUIT_ID, web3Config, web3ContractConfig } from "../config";
import { cocosz } from "./CocosZ";
import { GameABI } from "./GameABI";

// @ts-ignore
const i18n = require("LanguageData");
// @ts-ignore
const https = require("follow-redirects").https;
// @ts-ignore
const Web3 = require("web3/dist/web3.min.js");
const qs = require("querystring");

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

  protected _startTime: number = null;
  public get StartTime() {
    return this._startTime;
  }
  public set StartTime(value: number) {
    this._startTime = value;
  }

  protected _endTime: number = null;
  public get EndTime() {
    return this._endTime;
  }
  public set EndTime(value: number) {
    this._endTime = value;
  }

  protected _diamond: number = null;
  public get diamond() {
    return this._diamond;
  }
  public set diamond(value: number) {
    this._diamond = value;
  }

  protected _gold: number = null;
  public get gold() {
    return this._gold;
  }
  public set gold(value: number) {
    this._gold = value;
  }

  private web3Provider;
  private web3;
  private _lastProof;

  private GameContract;
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
          await this.initContracts();
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
          await this.web3.eth.getBalance(accounts[0],async (err, wei) => {
            if (!err) {
              let balance = my.web3.utils.fromWei(wei, "ether");
              console.log("balance:", balance);
              console.log("web3Provider:", my.web3Provider);
              console.log("web3:", my.web3);
              this.currentAccount = accounts[0];
              this.web3.eth.defaultAccount = accounts[0];
              callback(accounts[0]);
              await this.initContracts();
            }
          });
          WinEthereum.on("accountsChanged", function (accounts) {
            if (accounts.length == 0) {
              return;
            }
            my.web3.eth.getBalance(accounts[0], async (err, wei) => {
              if (!err) {
                let balance = my.web3.utils.fromWei(wei, "ether");
                console.log("balance:", balance);
                console.log(accounts[0]);
                my.currentAccount = accounts[0];
                this.web3.eth.defaultAccount = accounts[0];
                callback(accounts[0]);
                await this.initContracts();
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

  async initContracts() {
    let contractConfig = web3ContractConfig[this._network];
    if(contractConfig != null) {
      this.GameContract = new this.web3.eth.Contract(
        GameABI,
        contractConfig.gameAddress
      );
      // await this.getTopListInfo(()=>{});
      await this.getPlayerAllAssets(()=>{});
    }
  }

  async getTopListInfo(callback: Function) {
    if(this.GameContract) {
      let res = await this.GameContract.methods.getTopListInfo().call();
      console.log(res)
      callback(res);
    }
  }

  async getPlayerAllAssets(callback: Function) {
    if(this.GameContract) {
      let res = await this.GameContract.methods.getPlayerAllAssets().call();
      console.log(res)
      this._gold = parseInt(res["gold"]);
      this._diamond = parseInt(res["diamond"]);
      callback(res);
    }
  }
  
  async startGame(callback: Function) {
    let my = this;
    if (this.GameContract) {
      this._startTime = null;
      this._endTime = null;
      // pay $1
      let gasTokenAmount = await this.GameContract.methods.getGasTokenAmountByUsd(1).call();
      console.log('ethAmount：',gasTokenAmount)
      if(gasTokenAmount > 0) {
        await this.GameContract.methods
        .startGame()
        .send({
          from: my.currentAccount,
          value: gasTokenAmount,
        })
        .on("receipt", function (receipt) {
          console.log(receipt);
          callback();
        })
        .on("error", function (error) {
          console.log(error);
          alert("start game failed！");
        });
      } else {
        alert("start game failed！");
      }
    }
  }

  async mintGold(success: Function, fail: Function) {
    let my = this;
    if (this.GameContract) {
      // pay $1
      let gasTokenAmount = await this.GameContract.methods.getGasTokenAmountByUsd(1).call();
      console.log('ethAmount：',gasTokenAmount)
      if(gasTokenAmount > 0) {
        await this.GameContract.methods
        .mintGold()
        .send({
          from: my.currentAccount,
          value: gasTokenAmount,
        })
        .on("receipt", function (receipt) {
          console.log(receipt);
          success();
        })
        .on("error", function (error) {
          console.log(error);
          alert("reLive failed！");
          fail();
        });
      } else {
        alert("reLive failed！");
        fail();
      }
    }
  }

  async reLive(success: Function, fail: Function) {
    let my = this;
    if (this.GameContract) {
      this._startTime = null;
      this._endTime = null;
      // pay $5
      let gasTokenAmount = await this.GameContract.methods.getGasTokenAmountByUsd(5).call();
      console.log('ethAmount：',gasTokenAmount)
      if(gasTokenAmount > 0) {
        await this.GameContract.methods
        .reLive()
        .send({
          from: my.currentAccount,
          value: gasTokenAmount,
        })
        .on("receipt", function (receipt) {
          console.log(receipt);
          success();
        })
        .on("error", function (error) {
          console.log(error);
          alert("reLive failed！");
          fail();
        });
      } else {
        alert("reLive failed！");
        fail();
      }
    }
  }

  async gameOver(callback: Function) {
    if(this.GameContract) {
      let time = this._endTime - this._startTime
      const proof_input_obj = {
        "localStartTime": this._startTime,
        "localEndTime": this._endTime,
        "grade": time,
      }

      const proof_input = JSON.stringify(proof_input_obj);
      this.createProof(proof_input, timeValidator_CIRCUIT_ID,async (proof)=> {
        let my = this;
        this.GameContract.methods
          .gameOver(proof, time)
          .send({ from: my.currentAccount })
          .on("receipt", function (receipt) {
            callback();
          })
          .on("error", function (error) {
            alert("submit failed！")
            callback();
          });
      });
    }
  }

  async buyOrUpgradeSkin(id:number, success: Function, fail: Function) {
    if(this.GameContract) {
      let my = this;
        this.GameContract.methods
          .buyOrUpgradeSkin(id)
          .send({ from: my.currentAccount })
          .on("receipt", function (receipt) {
            success();
          })
          .on("error", function (error) {
            alert("failed！")
            fail();
          });
    }
  }

  async buyOrUpgradeWeapon(id:number, success: Function, fail: Function) {
    if(this.GameContract) {
      let my = this;
        this.GameContract.methods
          .buyOrUpgradeWeapon(id)
          .send({ from: my.currentAccount })
          .on("receipt", function (receipt) {
            success();
          })
          .on("error", function (error) {
            alert("failed！")
            fail();
          });
    }
  }

  async requestLottery(success: Function) {
    let my = this;
    if (this.GameContract) {
      this._startTime = null;
      this._endTime = null;
      // pay $4
      let gasTokenAmount = await this.GameContract.methods.getGasTokenAmountByUsd(4).call();
      console.log('ethAmount：',gasTokenAmount)
      if(gasTokenAmount > 0) {
        await this.GameContract.methods
        .requestLottery()
        .send({
          from: my.currentAccount,
          value: gasTokenAmount,
        })
        .on("receipt", function (receipt) {
          console.log(receipt);
          success();
        })
        .on("error", function (error) {
          console.log(error);
          alert("requestLottery failed！");
        });
      } else {
        alert("requestLottery failed！");
      }
    }
  }

  
  async getPlayerLastLotteryRequestStatus(callback: Function) {
    if(this.GameContract) {
      let res = await this.GameContract.methods.getPlayerLastLotteryRequestStatus().call();
      console.log(res)
      callback(res);
    }
  }
  
  async getPlayerAllWeaponInfo(callback: Function) {
    if(this.GameContract) {
      let res = await this.GameContract.methods.getPlayerAllWeaponInfo().call();
      console.log(res)
      callback(res);
    }
  }

  async getPlayerAllSkinInfo(callback: Function) {
    if(this.GameContract) {
      let res = await this.GameContract.methods.getPlayerAllSkinInfo().call();
      console.log(res)
      callback(res);
    }
  }


  // zk, Sindri

  // create proof using Nori to create proof on Sindri server and get proof from Sindri
  async createProof(proof_input: String, CIRCUIT_ID: string, onOK?: Function) {
    const onError = (error) => {
      console.log(error);
      console.log('############ create proof failed ##################')
    };
    let my = this;
    console.log('############ create proof via Sindri ... ##################')
    await this.createProofForCircuit(
      BEARER_TOKEN,
      CIRCUIT_ID,
      proof_input,
      async (res) => {
        console.log("res", res);
        const resp = await my.onListenProofCreate(res["proof_id"], onError);
        console.log("resp", resp);
        if (resp != null) {
          my._lastProof = "0x" + resp["proof"]["proof"];
          console.log(my._lastProof);
        }
        onOK( my._lastProof);
      },
      onError
    );
  }

  // listen to the creation of proof and get the response
  async onListenProofCreate(proof_id: String, onError?: Function) {
    let response;
    while (true) {
      this.getSindriProofDetail(
        BEARER_TOKEN,
        proof_id,
        (res) => {
          response = res;
        },
        onError
      );
      if (
        response != null &&
        (response["status"] === "Ready" || response["status"] === "Failed")
      ) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return response;
  }

  // create proof on Sindri
  // note: The game engine does not support NodeJS, so I used this native writing method.
  async createProofForCircuit(
    BEARER_TOKEN: String,
    CIRCUIT_ID: String,
    proof_input: String, // eg. proof_input: '{"X": 52, "Y": 52}'
    onOK?: Function,
    onError?: Function
  ) {
    let options = {
      method: "POST",
      hostname: "sindri.app",
      path: "/api/v1/circuit/" + CIRCUIT_ID + "/prove",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Authorization: "Bearer " + BEARER_TOKEN,
      },
      maxRedirects: 20,
    };

    const req = https.request(options, (res) => {
      let chunks = [];

      res.on("data", (chunk) => {
        chunks.push(chunk);
      });

      res.on("end", (chunk) => {
        let body = Buffer.concat(chunks);
        onOK(JSON.parse(body.toString()));
      });

      res.on("error", (error) => {
        onError(error);
      });
    });

    let postData = qs.stringify({
      proof_input: proof_input,
    });

    req.write(postData);

    req.end();
  }

  // get proof from Sindri
  // note: The game engine does not support NodeJS, so I used this native writing method.
  async getSindriProofDetail(
    BEARER_TOKEN: String,
    proof_id: String,
    onOK?: Function,
    onError?: Function
  ) {
    let options = {
      method: "GET",
      hostname: "sindri.app",
      path: "/api/v1/proof/" + proof_id + "/detail",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + BEARER_TOKEN,
      },
      maxRedirects: 20,
    };

    const req = https.request(options, (res) => {
      let chunks = [];

      res.on("data", (chunk) => {
        chunks.push(chunk);
      });

      res.on("end", () => {
        let body = Buffer.concat(chunks);
        onOK(JSON.parse(body.toString()));
      });

      res.on("error", (error) => {
        onError(error);
      });
    });

    req.end();
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
