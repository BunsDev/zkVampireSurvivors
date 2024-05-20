import { cBody } from '../../collision/Body';
import { Trigger, cObject } from '../../collision/Object';
import { Player } from './player';
const { ccclass, property } = cc._decorator;

const tempPos = new cc.Vec3();
const tempRot = new cc.Quat();

@ccclass
export class Enemy extends cObject {

    //缓存池管理
    static pools: Array<Enemy> = [];
    static get(prefab: cc.Prefab) {
        let enemy = this.pools.pop();
        if (!enemy) {
            let node = cc.instantiate(prefab);
            enemy = node.getComponent(Enemy);
        }

        return enemy;
    }

    static put(enemy: Enemy) {
        //压入缓存池管理节点
        this.pools.push(enemy);
        //移除node不回收body
        enemy.remove(false);
    }

    @property //最大移速
    speed: number = 0.0;

    // @property //攻击周期
    // cycleTime:number = 1.0;

    // @property //攻击范围
    // attackRadius: number = 100.0;

    init(): void {

        this.velocity.set(cc.Vec3.ZERO);

        this.unscheduleAllCallbacks();
        //定时探测主角位置
        this.schedule(() => {

            let pos = this.worldPosition; 
            let tartet = Player.inst.worldPosition; 
            cc.Vec3.subtract(this.velocity, tartet, pos);
            this.velocity.normalizeSelf().multiplyScalar(this.speed);

            //检测攻击范围，改动攻击
            //....

        }, 0.5, cc.macro.REPEAT_FOREVER, 0);
    }

    update(dt: number) {


        //计算新位置
        let pos = this.getPosition();
        let velocity = this.velocity;

        tempPos.x = pos.x + velocity.x * dt;
        tempPos.y = pos.y + velocity.y * dt;
        tempPos.z = pos.z + velocity.z * dt;

        this.setPosition(tempPos);
    }

    onTrigger(b: cBody,trigger:Trigger) {
        if(trigger == Trigger.exit) return;
        //碰撞自我加收
        Enemy.put(this);

        //播放死亡特效
        //.........
    }
}

