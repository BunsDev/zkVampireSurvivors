import { _decorator, CCInteger, Component, instantiate, Node, Prefab, Quat, Sprite, Vec2, Vec3 } from 'cc';
import { cCollider } from '../collision/Collider';
import { cObject } from '../collision/Object';
import { Joystick } from '../../components/Joystick/Joystick';
import { Bullet } from './bullet';
import { Ghost } from './ghost';
import { Player } from './player';
import { SnailTail } from './snailTail';
import { Skill } from './skill';
const { ccclass, property } = _decorator;

const tempPos = new Vec3();
const tempRot = new Quat();

@ccclass('BulletHell')
export class BulletHell extends Component {

    @property(Prefab)
    ghost: Prefab = null; //敌人

    @property(Prefab)
    snailTail: Prefab = null; //敌人

    @property(Prefab)
    player: Prefab = null; //主角

    @property(Node)
    objects: Node = null; //enemy 显示挂载点

    @property(Node)
    bullets: Node = null; //bullet 显示挂载点

    @property(Node)
    camera: Node = null; //跟随相机

    @property(Joystick)
    joystick: Joystick = null; //主角摇杆



    //简单模拟在周期时间内，以主角为中心的半径内产生敌人
    @property({ type: CCInteger, group: "Enemy Config" })
    max: number = 1000; //多敌人同屏数

    @property({ group: "Enemy Config" })
    raidus: number = 2000; //刷怪最大半径 

    @property({ group: "Enemy Config" })
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
        let node = instantiate(this.player);
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

    protected update(dt: number): void {
        //运行碰撞检测
        cCollider.inst.update(dt);
    }

    lateUpdate(dt: number): void {

        //相机跟随
        const position = Player.inst.getPosition();
        Vec3.lerp(tempPos, this.camera.position, position, 0.25);
        this.camera.position = tempPos;

        //背景跟随
        let bg = this.node.getChildByName("bg");
        let sprite = bg.getComponent(Sprite);
        let material = sprite.getMaterial(0);
        material.setProperty("tilingOffset", new Vec2(position.x / 512.0, -position.y / 512.0));
        bg.position = position;

    }

}

