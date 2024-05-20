import { cBody } from '../../collision/Body';
import { GroupIdxByName, Dirty, cObject, Trigger } from '../../collision/Object';
import { Player } from './player';
const { ccclass, property } = cc._decorator;

//Payer 探测触发器
@ccclass
export class detector extends cObject {

    @property//攻击半径
    attackRaidus: number = 0;

    @property  //收集半径
    collectRaidus: number = 0;
    
    //获取默认物理控制面板的分组信息
    GOODS = GroupIdxByName("goods");
    ENEMY = GroupIdxByName("enemy");

    start(): void {
        //自定义设置掩码,收集范围内的敌人和物品
        this.body.group = 0; //不接受任何掩码
        this.body.mask = this.ENEMY | this.GOODS;
    }

    // update(dt: number): void {
    //     //同步更新 player 位置 
    //     //注意：(由于是内层节点，需要手动设置标记)
    //     this.isDirty =  Dirty.T;
    // }

    onTrigger(b: cBody,trigger:Trigger) {
        if(trigger == Trigger.exit) return;


        //世界中心坐标
        let cb = b.getPosition(); // b.getPosition()
        let ca = this.body.getPosition(); // this.body.getPosition();
        let lengthSqr = cc.Vec3.squaredDistance(ca, cb);

        //攻击半径
        if (lengthSqr < this.attackRaidus * this.attackRaidus) {
            if (b.group == this.ENEMY) {
                Player.inst.onAttack(b);
            }
        }

        //收集半径
        if (lengthSqr < this.collectRaidus * this.collectRaidus) {
            if (b.group == this.GOODS) {
                Player.inst.onCollect(b);
            }
        }
    }
}

