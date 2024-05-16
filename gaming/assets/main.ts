import { Component, EventTouch, Label, Node, Prefab, Slider, Toggle, _decorator, instantiate, setDisplayStats } from 'cc';
import { BulletHell } from './fight/bulletHell';
import { Player } from './fight/player';

const { ccclass, property } = _decorator;

@ccclass('main')
export class main extends Component {

    @property(Prefab)
    demoBullet: Prefab = null;

    @property(Node)
    sceneNode: Node = null;

    @property(Label)
    totalTxt: Label = null;


    currentScene: Node = null;

    myAddress: any;

    start() {
        // this.onClickConnect();

        setDisplayStats(true);

        this.changeDemos();

        //刷新物体个数
        this.schedule(() => {
            let length = this.currentScene.getComponentInChildren(BulletHell).objects.children.length;
            this.totalTxt.string = "" + length;
        }, 0.1);
    }

    changeDemos() {
        if (this.currentScene) {
            //释放旧场景
            this.currentScene.removeFromParent();
            this.currentScene.destroy();
            this.currentScene = null;
        }

        this.currentScene = instantiate(this.demoBullet);
        this.node.getChildByName("Skill").active = true;

        //下一帧加载新场景
        this.scheduleOnce(() => {
            this.sceneNode.addChild(this.currentScene);
        });
    }


    onSkill(event:EventTouch) {

       Player.inst.onSkill();
       
       //示范做了个定时
       event.target.active = false;
       this.scheduleOnce(()=>{
        event.target.active = true;
       },5);
    }
}

