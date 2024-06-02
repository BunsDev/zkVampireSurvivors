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

  protected onOpen(): void {
    this._panel.scale = 0;
    cc.tween(this._panel).to(0.3, { scale: 1 }, { easing: "backOut" }).start();

    const rankingsList = [
      {
        chain: "polygon",
        address: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c",
        grade: 10000,
      },
      {
        chain: "avalanche",
        address: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846",
        grade: 40000,
      },
      {
        chain: "scroll",
        address: "0x8bB16BEDbFd62D1f905ACe8DBBF2954c8EEB4f66",
        grade: 12000,
      },
      {
        chain: "base",
        address: "0x8bB16BEDbFd62D1f905ACe8DBBF2954c8EEB4f61",
        grade: 22000,
      },
      {
        chain: "polygon",
        address: "0x8bB16BEDbFd62D1f905ACe8DBBF2954c8EEB4f62",
        grade: 12001,
      },
      {
        chain: "polygon",
        address: "0x8bB16BEDbFd62D1f905ACe8DBBF2954c8EEB4f63",
        grade: 12030,
      },
      {
        chain: "avalanche",
        address: "0x8bB16BEDbFd62D1f905ACe8DBBF2954c8EEB4f64",
        grade: 12450,
      },
      {
        chain: "optimism",
        address: "0x8bB16BEDbFd62D1f905ACe8DBBF2954c8EEB4f66",
        grade: 42000,
      },
    ];

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
        rankingsList[i].grade.toString();

      instance.parent = content;
    }
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
