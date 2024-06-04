import { cocosz } from "../Manager/CocosZ";
import { PanelName } from "../Manager/Constant";
import UIPage from "../Manager/UIPage";

const i18n = require("LanguageData");

const { ccclass, property } = cc._decorator;

@ccclass
export default class UIRankingsPanel extends UIPage {
  constructor() {
    super(PanelName.UIRankingsPanel);
    this.isValid() && this.onLoad();
  }

  private _panel: cc.Node = null;

  protected onLoad(): void {
    this._panel = this._page.getChildByName("panel");

    const btnNames: string[] = ["BtnBack"];
    for (let i = 0; i < btnNames.length; i++) {
      const btn: cc.Node = this._panel.getChildByName(btnNames[i]);
      if (btn) {
        btn.on(cc.Node.EventType.TOUCH_END, this._onBtnClickHandler, this);
      }
    }
  }

    // 0: Ethereum Sepolia testnet
    // 1: Avalanche Fuji testnet
    // 2: Polygon Amoy testnet
  getChainNameByIndex(index) {
    switch(index) {
      case 0:
        return 'ethereum';
      case 1:
          return 'avalanche';
      case 2:
        return 'polygon';
    }
    return 'ethereum';
  }

  parseGameTime(time) {
    let h = Math.floor(time / 3600000);
    let m = Math.floor((time % 3600000) / 60000);
    let s = Math.floor((time % 60000) / 1000);

    let r = "";
    if (h !== 0) {
        r += h + ":";
    }
    r += m < 10 ? "0" + m : m;
    r += ":";
    r += s < 10 ? "0" + s : s;
    return r;
}

formatTime(timestamp:string) {
  let date = new Date(parseInt(timestamp) * 1000);

  return date.toLocaleString('en-US', {
    hourCycle: "h24",
  });
}

  protected onOpen(): void {
    this._panel.scale = 0;
    cc.tween(this._panel).to(0.3, { scale: 1 }, { easing: "backOut" }).start();

    
    cocosz.web3Mgr.getTopListInfo((result)=>{
      let rankingsList = []
      let topGradeList = result[0];
      let topChainIndex = result[1];
      let topPlayerList = result[2];
      let lastUpdateTime = result[3];
      for(let i=0; i<10;i++) {
        let grade = parseInt(topGradeList[i]);
        if(grade>0) {
          rankingsList.push(
            {
              'chain': this.getChainNameByIndex(parseInt(topChainIndex[i])),
              'address': topPlayerList[i],
              'grade': grade,
            }
          )
        }
      }

      if(lastUpdateTime != null && lastUpdateTime != "") {
        let timeStr = this.formatTime(lastUpdateTime);
        let timeNode = cc.find("panel/latestTime", this._page);
        timeNode.getComponent(cc.Label).string = "Last updated on   " + timeStr;
        timeNode.active = true;
      }

      rankingsList.sort((a, b) => b.grade - a.grade);

      let list = cc.find("panel/list", this._page);
      let content = cc.find("view/content", list);
      for (let i = 0; i < rankingsList.length; i++) {
        let pre = cocosz.resMgr.getRes("RankingListItem", cc.Prefab);
        const instance: cc.Node = cc.instantiate(pre);
  
        instance.getChildByName("icon").getComponent(cc.Sprite).spriteFrame =
          cocosz.resMgr.getRes(rankingsList[i].chain + "_logo", cc.SpriteFrame);
        let address = rankingsList[i].address;
        instance.getChildByName("rank").getComponent(cc.Label).string =
          "NO." + (i + 1);
        instance.getChildByName("address").getComponent(cc.Label).string =
          address.slice(0, 6) + "..." + address.slice(-4);
        instance.getChildByName("grade").getComponent(cc.Label).string =
          this.parseGameTime(rankingsList[i].grade);
  
        instance.parent = content;
      }
    });
  }

  protected async _onBtnClickHandler(event: cc.Event.EventTouch) {
    await cocosz.audioMgr.playBtnEffect().catch();
    switch (event.target.name) {
      case "BtnBack": {
        cocosz.uiMgr.closePanel(PanelName.UIRankingsPanel);
        break;
      }
    }
  }
}
