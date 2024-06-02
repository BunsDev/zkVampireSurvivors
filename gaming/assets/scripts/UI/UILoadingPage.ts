import UIPage from "../Manager/UIPage";
import Constant, { PageName } from "../Manager/Constant";
import { cocosz } from "../Manager/CocosZ";

const { ccclass } = cc._decorator;

@ccclass
export default class UILoadingPage extends UIPage {
  private _loadingBar: cc.ProgressBar = null;
  private _progressStep = 0.01;
  private _tweenID: number | null = null;

  _LoadingBar: cc.Node;
  _BtnWallet: cc.Node;
  _BtnSelectNetwork: cc.Node;
  _BtnStartGame: cc.Node;

  private _network_icon: cc.Node = null;
  private _network_name: cc.Node = null;
  private _network_frame_set: cc.Node = null;
  private _wallet_icon: cc.Node = null;
  private _wallet_name: cc.Node = null;
  private _wallet_frame_set: cc.Node = null;
  private _btnEthereum: cc.Node = null;
  private _btnAvalanche: cc.Node = null;
  private _btnPolygon: cc.Node = null;
  private _btnMetaMask: cc.Node = null;

  constructor() {
    super(PageName.UILoadingPage);
    this.isValid() && this.onLoad();
  }

  /**
   * 页面加载时调用，初始化健康警告和加载条
   */
  protected onLoad() {
    let btnNames: string[] = [
      "BtnSelectNetwork",
      "BtnWallet",
      "BtnStartGame",
      "BtnSelectNetwork/frame_set/BtnEthereum",
      "BtnSelectNetwork/frame_set/BtnAvalanche",
      "BtnSelectNetwork/frame_set/BtnPolygon",
      "BtnWallet/frame_set/BtnMetaMask",
    ];
    btnNames.forEach((name) => {
      let btn: cc.Node = cc.find(name, this._page);
      if (btn) {
        btn.on(cc.Node.EventType.TOUCH_END, this._onBtnClickHandler, this);
        if (btn.name == "BtnSelectNetwork") {
          this._network_frame_set = cc.find("frame_set", btn);
        } else if (btn.name == "BtnWallet") {
          this._wallet_frame_set = cc.find("frame_set", btn);
        } else if (btn.name == "BtnEthereum") {
          this._btnEthereum = btn;
        } else if (btn.name == "BtnAvalanche") {
          this._btnAvalanche = btn;
        } else if (btn.name == "BtnPolygon") {
          this._btnPolygon = btn;
        } else if (btn.name == "BtnMetaMask") {
          this._btnMetaMask = btn;
        } else if (btn.name == "BtnStartGame") {
          this._BtnStartGame = btn;
        }
      }
    });
    this._initializeLoadingBar();
  }

  /**
   * 页面打开时调用，注册事件监听并启动加载动画
   */
  protected onOpen() {
    if (this.isValid()) {
      this._LoadingBar = cc.find("LoadingBar", this._page);
      this._BtnWallet = cc.find("BtnWallet", this._page);
      this._BtnSelectNetwork = cc.find("BtnSelectNetwork", this._page);
      this._BtnStartGame = cc.find("BtnStartGame", this._page);

      this._network_icon = cc.find("Background/icon", this._BtnSelectNetwork);
      this._network_name = cc.find("Background/name", this._BtnSelectNetwork);
      this._wallet_icon = cc.find("Background/icon", this._BtnWallet);
      this._wallet_name = cc.find("Background/name", this._BtnWallet);

      cc.game.on(Constant.E_GAME_LOGIC, this._onGameMassageHandler, this);
      this._loadingBar.progress = this._progressStep;
      this._startLoadingAnimation();

      cocosz.schedule(() => {
        let network = cocosz.web3Mgr.Network;
        let networkMain = cocosz.web3Mgr.NetworkMain;
        let wallet = cocosz.web3Mgr.Wallet;
        let address = cocosz.web3Mgr.Address;

        let isNetworkSelected =
          network != null &&
          network != "" &&
          networkMain != null &&
          networkMain != "";
        let isWalletAndAddressSelected =
          wallet != null && wallet != "" && address != null && address != "";
        if (cocosz.isResourceLoaded) {
          cc.find("LoadingBar", this._page).active = false;
          this._BtnWallet.active = true;
          this._BtnSelectNetwork.active = true;
        }
        if (isNetworkSelected) {
          this._network_icon.getComponent(cc.Sprite).spriteFrame =
            cocosz.resMgr.getRes(networkMain + "_logo", cc.SpriteFrame);
          this._network_name.getComponent(cc.Label).string = network;
        }
        if (isWalletAndAddressSelected) {
          this._wallet_name.getComponent(cc.Label).string = address;
          this._wallet_icon.getComponent(cc.Sprite).spriteFrame =
            cocosz.resMgr.getRes(wallet + "_logo", cc.SpriteFrame);
          this._BtnStartGame.active = true;
        }
      }, 0.1);
    }
  }

  protected onClose() {
    cc.game.targetOff(this);
    if (this._tweenID !== null) {
      cc.Tween.stopAllByTag(this._tweenID);
    }
  }

  handleSelectNetwork() {
    this._network_frame_set.stopAllActions();
    let t =
      (this._network_frame_set.scaleY ? this._network_frame_set.scaleY : 1) / 2;
    cc.tween(this._network_frame_set)
      .to(
        t,
        { scaleY: this._network_frame_set.scaleY ? 0 : 1 },
        { easing: "sineInOut" }
      )
      .start();
  }

  handleWallet() {
    this._wallet_frame_set.stopAllActions();
    let t =
      (this._wallet_frame_set.scaleY ? this._wallet_frame_set.scaleY : 1) / 2;
    cc.tween(this._wallet_frame_set)
      .to(
        t,
        { scaleY: this._wallet_frame_set.scaleY ? 0 : 1 },
        { easing: "sineInOut" }
      )
      .start();
  }

  private async _onBtnClickHandler(event: cc.Event.EventTouch) {
    await cocosz.audioMgr.playBtnEffect().catch();

    switch (event.target.name) {
      case "BtnStartGame": {
        cocosz.unscheduleAllCallbacks();
        cocosz.goToHome();
        break;
      }
      case "BtnSelectNetwork": {
        this.handleSelectNetwork();
        break;
      }
      case "BtnWallet": {
        this.handleWallet();
        break;
      }
      case "BtnEthereum": {
        this.handleSelectNetwork();
        cocosz.web3Mgr.selectNetwork("Ethereum Sepolia testnet", "ethereum");
        break;
      }
      case "BtnAvalanche": {
        this.handleSelectNetwork();
        cocosz.web3Mgr.selectNetwork("Avalanche Fuji testnet", "avalanche");
        break;
      }
      case "BtnPolygon": {
        this.handleSelectNetwork();
        cocosz.web3Mgr.selectNetwork("Polygon Amoy testnet", "polygon");
        break;
      }
      case "BtnMetaMask": {
        this.handleWallet();
        cocosz.web3Mgr.selectAddress("MetaMask");
        break;
      }
    }
  }

  private _initializeLoadingBar() {
    this._loadingBar = cc
      .find("LoadingBar", this._page)
      .getComponent(cc.ProgressBar);
  }

  private _startLoadingAnimation() {
    this._tweenID = Date.now();

    cc.tween(this._page)
      .tag(this._tweenID)
      .delay(0.2)
      .call(() => {
        this._updateLoadingProgressStep();
      })
      .union()
      .repeatForever()
      .start();
  }

  private _updateLoadingProgressStep() {
    const newProgress = this._loadingBar.progress + this._progressStep;
    if (newProgress < 1) {
      this._updateProgress(newProgress);
    }
  }

  private _onGameMassageHandler(event: any) {
    switch (event.type) {
      case Constant.E_UPDATE_PROGRESS: {
        this._updateProgress(event.data);
        break;
      }
      default:
        console.warn(`Unhandled event type: ${event.type}`);
    }
  }

  private _updateProgress(pro: number) {
    if (pro > this._loadingBar.progress && pro <= 1) {
      this._loadingBar.progress = pro;
    }
  }
}
