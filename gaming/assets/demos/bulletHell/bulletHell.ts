import { cCollider } from '../../collision/Collider';
import { cObject } from '../../collision/Object';
import { Joystick } from '../../Joystick/Joystick';
import { Bullet } from './bullet';
import { Ghost } from './ghost';
import { Player } from './player';
import { SnailTail } from './snailTail';
import { Skill } from './skill';
const { ccclass, property } = cc._decorator;

const tempPos = new cc.Vec3();
const tempRot = new cc.Quat();

@ccclass
export class BulletHell extends cc.Component {

    @property(cc.Prefab)
    ghost: cc.Prefab = null; //敌人

    @property(cc.Prefab)
    snailTail: cc.Prefab = null; //敌人

    @property(cc.Prefab)
    player: cc.Prefab = null; //主角

    @property(cc.Node)
    objects: cc.Node = null; //enemy 显示挂载点

    @property(cc.Node)
    bullets: cc.Node = null; //bullet 显示挂载点

    @property(cc.Node)
    camera: cc.Node = null; //跟随相机

    @property(Joystick)
    joystick: Joystick = null; //主角摇杆



    //简单模拟在周期时间内，以主角为中心的半径内产生敌人
    @property(cc.Integer)
    max: number = 1000; //多敌人同屏数

    @property
    raidus: number = 2000; //刷怪最大半径 

    @property
    cyclTime: number = 0.03; //刷怪cd周期

    //自行扩展控制策略
    //....


    private static _inst: BulletHell = null;
    static get inst() {
        return this._inst;
    }

    onLoad(): void {
        BulletHell._inst = this;
    }

    onDestroy(): void {

        cCollider.inst.clear();
        Ghost.pools.length = 0;
        Skill.pools.length = 0;
        Bullet.pools.length = 0;
        SnailTail.pools.length = 0;
    }

    start(): void {

        //创建主角直接挂在场景下
        let node = cc.instantiate(this.player);
        this.node.addChild(node);

        const phi2 = 1.3247179572447458;
        const a1 = 1.0 / (phi2 * phi2);
        const a2 = 1.0 / phi2;

        //定时刷怪
        let i = 1;
        this.schedule(() => {

            if (this.objects.children.length < this.max) {
                let x = (0.5 + a2 * i) % 1;
                let y = (0.5 + a1 * i) % 1;
                this.createEnemy(x, y);
                i++;
            }

        }, this.cyclTime);
    }

    createEnemy(x: number, y: number) {

        let enemy: cObject = null;

        //随机产生两种
        if (Math.random() > 0.5)
            enemy = Ghost.get(this.ghost);
        else
            enemy = SnailTail.get(this.snailTail);

        enemy.insert(this.objects);


        //以主角为中心进行刷怪
        let center = Player.inst.getPosition();
        tempPos.x = (x - 0.5) * this.raidus + center.x;
        tempPos.y = (y - 0.5) * this.raidus + center.y;
        tempPos.z = 0; //更新位置
        enemy.setPosition(tempPos);

        enemy.init(); //初始化
    }

    update(dt: number) {
        //运行碰撞检测
        cCollider.inst.update(dt);
    }

    lateUpdate(dt: number): void {
        //相机跟随
        const position = Player.inst.getPosition();
        cc.Vec3.lerp(tempPos, this.camera.position, position, 0.25);
        this.camera.position = tempPos;

        //背景跟随
        let bg = this.node.getChildByName("bg");
        if(bg){
            let sprite = bg.getComponent(cc.Sprite);
            if(sprite){
                let material = sprite.getMaterial(0);
                material.setProperty("tilingOffset", new cc.Vec2(position.x / 512.0, -position.y / 512.0));
                bg.position = position;
            }
        }
    }
}

