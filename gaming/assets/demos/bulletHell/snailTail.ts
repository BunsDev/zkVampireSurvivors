
import { cBody } from '../../collision/Body';
import { GroupIdxByName, Trigger, cObject } from '../../collision/Object';
import { Player } from './player';
const { ccclass, property } = cc._decorator;

const tempPos = new cc.Vec3();
const tempRot = new cc.Quat();

@ccclass
export class SnailTail extends cObject {

    //缓存池管理
    static pools: Array<SnailTail> = [];
    static get(prefab: cc.Prefab) {
        let snailtail = this.pools.pop();
        if (!snailtail) {
            let node = cc.instantiate(prefab);
            snailtail = node.getComponent(SnailTail);
        }

        return snailtail;
    }

    static put(snailtail: SnailTail) {
        //压入缓存池管理节点
        this.pools.push(snailtail);
        //移除node不回收body
        snailtail.remove(false);
    }

    @property //最大移速
    speed: number = 0.0;


    @property //检测周期
    checkTime: number = 0.5;

    // @property //攻击周期
    // cycleTime:number = 0.5;

    // @property //攻击范围
    // attackRadius: number = 100.0;

    nextCheck: number = 0; //下一轮时间

    //获取默认物理控制面板的分组信息
    PLAYER = GroupIdxByName("player");//PhysicsSystem.PhysicsGroup["player"];
    BULLET = GroupIdxByName("bullet");//PhysicsSystem.PhysicsGroup["bullet"];

    init(): void {
        //重置状态
        this.nextCheck = 0;
        this.velocity.set(cc.Vec3.ZERO);
    }

    update(dt: number) {
        //计算新位置
        let pos = this.getPosition();
        let velocity = this.velocity;

        tempPos.x = pos.x + velocity.x * dt;
        tempPos.y = pos.y + velocity.y * dt;
        tempPos.z = pos.z + velocity.z * dt;

        this.setPosition(tempPos);

        this.check(dt);
    }


    check(dt: number) {

        this.nextCheck -= dt;
        if (this.nextCheck <= 0) {
            this.nextCheck = this.checkTime;

            let scale = this.getScale(); //this.getScale();
            let pos = this.worldPosition; //this.getPosition();
            let tartet = Player.inst.worldPosition; //Player.inst.getPosition();
            
            cc.Vec3.subtract(this.velocity, tartet, pos);
            this.velocity.normalizeSelf().multiplyScalar(this.speed);

            if (this.velocity.x * scale.x < 0) {
                //调整旋转方向
                scale.x = -scale.x;
                this.setScale(scale);
            }

            //检测攻击范围，改动攻击
            //....
        }
    }

    onTrigger(b: cBody,trigger:Trigger) {
        if(trigger == Trigger.exit) return;

        switch (b.group) {
            case this.BULLET: //碰到子弹
                break;
            case this.PLAYER: //碰到player
                break;
        }

        //碰撞自我加收
        SnailTail.put(this);

        //播放死亡特效
        //.........
    }
}

