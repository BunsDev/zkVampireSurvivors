
import { cBody } from '../../collision/Body';
import { Trigger, cObject } from '../../collision/Object';
const { ccclass, property } = cc._decorator;

const tempPos = new cc.Vec3();
const tempRot = new cc.Quat();

@ccclass
export class Skill extends cObject {

    //缓存池管理
    static pools: Array<Skill> = [];
    static get(prefab: cc.Prefab) {
        let skill = this.pools.pop();
        if (!skill) {
            let node = cc.instantiate(prefab);
            skill = node.getComponent(Skill);
        }
        return skill;
    }

    static put(skill: Skill) {
        //压入缓存池管理节点
        this.pools.push(skill);
        //移除node不回收body
        skill.remove(false);
    }

    //生命周期，回收时间
    lifeTime: number = 0;
    //attack: number = 0;
    


    update(dt: number) {

        this.lifeTime -= dt;
        if (this.lifeTime < 0) {
            //生命周期回收
            Skill.put(this);
            return;
        }

        //计算新位置
        let pos = this.getPosition();
        let velocity = this.velocity;

        tempPos.x = pos.x + velocity.x * dt;
        tempPos.y = pos.y + velocity.y * dt;
        tempPos.z = pos.z + velocity.z * dt;


        //更新节点旋转
        this.angle+=dt*1000*60; //弧度转角度
        this.setAngle(this.angle*180/Math.PI);

        this.setPosition(tempPos);

    }


    onTrigger(b: cBody,trigger:Trigger) {
        if(trigger == Trigger.exit) return;
        //击中回收子弹
        //Skill.put(this);
        //播放爆炸特效
        //.........
    }
}

