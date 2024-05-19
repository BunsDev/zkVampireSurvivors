import { _decorator, instantiate, macro, Prefab, Quat, Vec3 } from 'cc';
import { cBody } from '../collision/Body';
import { cObject, Trigger } from '../collision/Object';
import { Player } from './player';
const { ccclass, property } = _decorator;

const tempPos = new Vec3();
const tempRot = new Quat();
@ccclass('Enemy')
export class Enemy extends cObject {

    //缓存池管理
    static pools: Array<Enemy> = [];
    static get(prefab: Prefab) {
        let enemy = this.pools.pop();
        if (!enemy) {
            let node = instantiate(prefab);
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

        this.velocity.set(Vec3.ZERO);

        this.unscheduleAllCallbacks();
        //定时探测主角位置
        this.schedule(() => {

            let pos = this.node.worldPosition; 
            let tartet = Player.inst.node.worldPosition; 
            Vec3.subtract(this.velocity, tartet, pos);
            this.velocity.normalize().multiplyScalar(this.speed);

            //检测攻击范围，改动攻击
            //....

        }, 0.5, macro.REPEAT_FOREVER, 0);
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

    onTrigger(b: cBody,trigger: Trigger) {
        if(trigger == Trigger.exit ) return;
        //碰撞自我加收
        Enemy.put(this);

        //播放死亡特效
        //.........
    }
}

