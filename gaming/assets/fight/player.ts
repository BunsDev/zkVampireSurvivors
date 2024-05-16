import { Input, Prefab, Quat, Vec3, _decorator } from 'cc';
import { cBody } from '../collision/Body';
import { Trigger, cObject } from '../collision/Object';
import { BulletHell } from './bulletHell';
import { Gun } from './gun';
import { Skill } from './skill';
const { ccclass, property } = _decorator;

const tempPos = new Vec3();
const tempRot = new Quat();

@ccclass('Player')
export class Player extends cObject {

    private static _inst: Player = null;
    static get inst() {
        return this._inst;
    }

    @property
    speed: number = 1.0;

    @property(Prefab)
    skill:Prefab = null;

    guns: Array<Gun> = [];
    velocity: Vec3 = new Vec3();

    onLoad(): void {
        super.onLoad();
        Player._inst = this;
    }

    start(): void {

        //获取当前枪枝
        this.guns = this.node.getComponentsInChildren(Gun);

        //绑定摇杆回调
        const joystick = BulletHell.inst.joystick;
        if (joystick) {

            joystick.init((event) => {

                let angle = event.angle;
                let ratio = event.ratio;
                switch (event.type) {
                    case Input.EventType.TOUCH_START:
                        this.velocity.set(Vec3.ZERO);
                        break;
                    case Input.EventType.TOUCH_MOVE:
                        this.velocity.set(Math.cos(angle), Math.sin(angle), 0);
                        this.velocity.multiplyScalar(this.speed * ratio);
                        break;
                    case Input.EventType.TOUCH_END:
                        this.velocity.set(Vec3.ZERO);
                        break;
                }
            });
        }

    }

    update(dt: number): void {

        //计算新位置
        let pos = this.getPosition();
        let velocity = this.velocity;

        tempPos.x = pos.x + velocity.x * dt;
        tempPos.y = pos.y + velocity.y * dt;
        tempPos.z = pos.z + velocity.z * dt;

        this.setPosition(tempPos);
    }

    onAttack(b: cBody) {
        //进入攻击范围
        let guns = this.guns;
        let length = guns.length;

        for (let i = 0; i < length; i++) {
            let postion = b.getCenter();
            guns[i].shoot(postion);
        }
    }

    onSkill(){

        let angle = Math.random()*Math.PI*2;

        for(let i = 0;i < 3;i++){

            let parent = BulletHell.inst.bullets;
            let skill = Skill.get(this.skill);
            skill.insert(parent); 
            skill.init();
    
            Vec3.subtract(tempPos, this.node.worldPosition, parent.worldPosition);
            skill.setPosition(tempPos);
    
            //发射速度和生命时长
            let speed = 300;
            angle+=Math.PI*2/3;
            let x = Math.cos(angle),y = Math.sin(angle);
            skill.velocity.set(x,y,0).multiplyScalar(speed);
    
            skill.angle = 0;
            skill.lifeTime = 3;
        }

    }

    onCollect(b: cBody) {
        //进入拾取范围
    }

    onTrigger(b: cBody,trigger: Trigger) {
        if(trigger == Trigger.exit ) return;
        //碰撞到敌方
        //自行扣血或者死亡
    }
}

