import { Line } from "./Maths";
import { Dirty, cObject } from "./Object";
import { cShape } from "./Shape";

const Mat3 = cc.Mat3;
const Quat = cc.Quat;
const Vec3 = cc.Vec3;

const IsIdentity = function (quat: cc.Quat) {

    if (quat.x != 0 ||
        quat.y != 0 ||
        quat.z != 0 ||
        quat.w != 1)
        return false;

    return true;
}


export class cBody {

    id: number = 0;
    mask: number = 0;
    group: number = 0;
    shape: cShape = null;
    object: cObject = null;
    priority:number = 0;

    //脏区更新标记
    isDirty: number = 1 | 2 | 4 |8;


    //缓存
    lower: number = 0;
    upper: number = 0;
    aabb: Array<number> = [0, 0, 0, 0, 0, 0];

    //状态
    isRemove: boolean = false;
    isRetrieve: boolean = false;
    isIdentity: boolean = false;
    inCollider: boolean = false;

    //缓存
    raidus: number = 0;
    points: Array<cc.Vec2> = [];
    center: cc.Vec3 = new Vec3();
    rotMat3: cc.Mat3 = new Mat3();
    halfSize: cc.Vec3 = new Vec3();
    scale: cc.Vec3 = new Vec3(1,1,1);

    //Agent
    isAgent:boolean = false;  //Agent 开关
    maxNeighbors: number = 0;
    neighborDist: number = 0; //物体半径
    maxVelocity: number = 0;  //最大速度
    newVelocity:cc.Vec3 = new Vec3();
    prefVelocity:cc.Vec3 = new Vec3();
    orcaLines:Array<Line> = [];

    constructor(obj: cObject) {
        this.object = obj;
    }

    updateBound(force: Dirty = Dirty.NON) {

        let object = this.object; //force 强制全局刷新
        object.updateWorldRTS(force);
        let isDirty = force | object.isDirty;

        if(this.isAgent){

            let v = object.velocity;
            this.newVelocity.x = v.x;
            this.newVelocity.y = v.y;

            // let pv = this.prefVelocity;
            // pv.x+= (v.x - pv.x)*0.75;
            // pv.y+= (v.y - pv.y)*0.75;
        }

        if (isDirty > 0) {

            let aabbChange = false;
            const shape = this.shape;

            if (isDirty & Dirty.S) {
                aabbChange = true;
                let s = this.getScale();
                this.scale.x = (s.x >= 0 ? s.x : -s.x);
                this.scale.y = (s.y >= 0 ? s.y : -s.y);
                this.scale.z = (s.z >= 0 ? s.z : -s.z);
            }

            if (isDirty & Dirty.R) {
                //旋转更新aabb
                this.isIdentity = IsIdentity(this.getRotation());
                aabbChange = true;
            }

            if (aabbChange) shape.updateAABB(this.getScale(),this.getRotMat3(), this.isIdentity);


            const AABB = this.aabb;// world aabb
            const aabb = shape.aabb; //local aabb
            const p = this.getPosition(); //world postion

            AABB[0] = aabb[0] + p.x;
            AABB[1] = aabb[1] + p.y;
            AABB[2] = aabb[2] + p.z;

            AABB[3] = aabb[3] + p.x;
            AABB[4] = aabb[4] + p.y;
            AABB[5] = aabb[5] + p.z;


            this.isDirty = 1 | 2 | 4 | 8; //设置脏区标记

            object.isDirty = Dirty.NON; //清除object状态

            return true;
        }

        return false;
    }

    clear() {
        // this.id = 0;
        this.shape = null;
        this.object = null;
        this.isRemove = false;
        this.inCollider = false;
        this.orcaLines.length = 0;
        // this.object.body = null;
    }


    //body 坐标统一使用世界数据进行计算
    getScale() { return this.object.worldScale; } // world scale 
    getPosition() { return this.object.worldPosition; } //wold position
    getRotation() { return this.object.worldRotation; } //world rotation quat
    getRotMat3() {return this.object.worldRotatioMat3;} //world rotation mat3

    getCenter() {

        if (this.isDirty & 1) {
            this.isDirty &= (~1);

            const aabb = this.aabb;
            const center = this.center;
            center.x = (aabb[0] + aabb[3]) * 0.5;
            center.y = (aabb[1] + aabb[4]) * 0.5;
            center.z = (aabb[2] + aabb[5]) * 0.5;
        }

        return this.center; //world center
    }

    getRaidus() {

        if (this.isDirty & 2) {
            this.isDirty &= (~2);

            const scale = this.scale;
            const raidus = this.shape.radius;
            this.raidus = Math.max(scale.x, scale.y, scale.z)* raidus;
        
        }

        return this.raidus; //world raidus
    }

    getHalfSize() {
        
        if (this.isDirty & 4) {
            this.isDirty &= (~4);

            const scale = this.scale;
            const size = this.shape.size;
            const halfSize = this.halfSize;
           
            halfSize.x = scale.x * size.x*0.5;
            halfSize.y = scale.y * size.y*0.5;
            halfSize.z = scale.z * size.z*0.5;

        }

        return this.halfSize; //world halfsize
    }

    getPoints(){

        if (this.isDirty & 8) {
            this.isDirty &= (~8);

            const scale = this.scale;
            const m = this.getRotMat3().m;
            const center = this.getCenter();
           
            let points = this.points;
            let sp = this.shape.point2Ds;

            let length = sp.length;
            for(let i = 0;i < length;i++){
                let x = sp[i].x * scale.x;
                let y = sp[i].y * scale.y;
                let z = 0;
                if(points[i] == undefined) { points[i] = new cc.Vec2()}
                points[i].x = (x * m[0] + y * m[3] + z * m[6]) + center.x;
                points[i].y = (x * m[1] + y * m[4] + z * m[7]) + center.y;
                // out.z = x * m.m02 + y * m.m05 + z * m.m08;

            }
            points.length = length;
        }

        return this.points; //world points
    }
}
