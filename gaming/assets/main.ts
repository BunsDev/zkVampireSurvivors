
import { BulletHell } from './demos/bulletHell/bulletHell';
import { Player } from './demos/bulletHell/player';

const { ccclass, property } = cc._decorator;

@ccclass
export class main extends cc.Component {

    @property(cc.Prefab)
    demoBullet: cc.Prefab = null;

    @property(cc.Node)
    demosNode: cc.Node = null;

    @property(cc.Label)
    totalTxt: cc.Label = null;


    currScense: cc.Node = null;

    start() {
        this.changeDemos();

        //刷新物体个数
        this.schedule(() => {
            let length = this.currScense.getComponentInChildren(BulletHell).objects.children.length;
            this.totalTxt.string = "" + length;
        }, 0.1);
    }

    changeDemos() {
        if (this.currScense) {
            //释放旧场景
            this.currScense.removeFromParent();
            this.currScense.destroy();
            this.currScense = null;
        }

        this.currScense = cc.instantiate(this.demoBullet);
        this.node.getChildByName("Skill").active = true;

        //下一帧加载新场景
        this.scheduleOnce(() => {
            this.demosNode.addChild(this.currScense);
        });
    }

    onSkill(event: cc.Event.EventTouch) {
        Player.inst.onSkill();

        event.target.active = false;
        this.scheduleOnce(() => {
            event.target.active = true;
        }, 5);
    }
}

