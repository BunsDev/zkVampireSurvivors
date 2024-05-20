import { Bullet } from './bullet';
import { BulletHell } from './bulletHell';
const { ccclass, property } = cc._decorator;

const tempPos = new cc.Vec3();
const tempRot = new cc.Quat();

@ccclass
export class Gun extends cc.Component {

    @property(cc.Prefab)
    bullet: cc.Prefab = null;

    @property(cc.Node)
    point: cc.Node = null;  //子弹射锚点

    @property
    speed: number = 1.0; //子弹飞行最大速度

    @property
    lifeTime: number = 0.5; //子弹飞行最长时间

    @property
    cycleTime: number = 0.5; //子弹发射间隔


    minDist: number = 0;  //最近发射位置
    nextCycle: number = 0; //下次发射时间
    isShoot: boolean = false; //是否上弹
    direction: cc.Vec3 = new cc.Vec3(); //发射方向 


    shoot(targetWorldPos: cc.Vec3) {

        //是否可以上弹
        if (this.nextCycle > 0) return;

        this.node.convertToWorldSpaceAR(cc.Vec3.ZERO,tempPos);
        cc.Vec3.subtract(tempPos, targetWorldPos, tempPos);

        //计算与怪的距离
        let lengthSqr = tempPos.lengthSqr();
        if (!this.isShoot) {
            //首次上弹记录
            this.isShoot = true;
            this.minDist = lengthSqr;
            this.direction.set(tempPos);
            return;
        }

        //保留最近的怪
        if (lengthSqr < this.minDist) {
            this.minDist = lengthSqr;
            this.direction.set(tempPos);
        }

    }

    update(dt: number): void {

        this.nextCycle -= dt;
        if (this.isShoot) {
            this.isShoot = false;
            this.nextCycle = this.cycleTime;
            

            let parent = BulletHell.inst.bullets;
            let bullet = Bullet.get(this.bullet);
            bullet.insert(parent); //添加到显示父节点
            bullet.init();

            this.point.convertToWorldSpaceAR(cc.Vec3.ZERO,tempPos); //局部转世界
            parent.convertToNodeSpaceAR(tempPos,tempPos); //世界转局部
            bullet.setPosition(tempPos);//计算发射的起点

            //计算发射角度
            let dir = this.direction.normalizeSelf();
            let angle = Math.atan2(dir.y, dir.x);
            angle = cc.misc.radiansToDegrees(angle);
            bullet.setAngle(angle);

            //发射速度和生命时长
            bullet.velocity.set(dir).multiplyScalar(this.speed);
            bullet.lifeTime = this.lifeTime;


            //调整枪管瞄准方向
            //this.node.setRotation(tempRot);
            this.node.angle = angle;


        }
    }

}

