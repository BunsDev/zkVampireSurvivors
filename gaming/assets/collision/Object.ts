// import { Color, Component, Node, PhysicsSystem, Quat, Vec3, _decorator, ccenum } from 'cc';
import { cBody } from './Body';
import { cCollider } from './Collider';
import { ShapeType, cBox , cPolygon, cShape, cSphere } from './Shape';
const { ccclass, property } = cc._decorator;

cc.Enum(ShapeType)

export enum Trigger {
    default = 0,
    enter = 1,
    stay = 2,
    exit = 3,
};

export enum Dirty {
    R = 1,
    T = 2,
    S = 4,
    RTS = 7,
    RS = R | S,
    NON = 0,
};

//从名字获取碰撞分组id， name->group
export const GroupIdxByName = function (name: string) {
    const id = cc.game['groupList'].indexOf(name);
    return id >= 0 ? 1 << id : 0;
}

//从分组id获取碰撞掩码, group->mask
export const MaskBitByGroup = function (groupIndex: number) {
    let maskBits = 0;
    let bits = cc.game['collisionMatrix'][groupIndex];
    for (let i = 0; i < bits.length; i++) {
        if (!bits[i]) continue;
        maskBits |= 1 << i;
    }

    return maskBits;
}


@ccclass
export class cObject extends cc.Component {

    @property()
    trigger: boolean = false; //碰撞开关

    _shape: cc.Collider;
    _type:ShapeType = ShapeType.Box;
    //ShapeType = ShapeType.Box; //相交形状类型
    @property({ type: ShapeType })
    set type(type){
        if(this._type != type){
            this._type = type;
        }
    }
    get type(){ return this._type;}

    @property({})
    center: cc.Vec3 = new cc.Vec3();  //偏移位置，是shape相对node节点的中心偏移

    @property({ visible() { return this.type == ShapeType.Box; } })
    size: cc.Vec3 = new cc.Vec3(); //方块的长宽高

    @property({ visible() { return this.type == ShapeType.Sphere; } })
    radius: number = 0; //半径，sphere 或者 capsule

    @property({ type:[cc.Vec2] ,visible() { return this.type == ShapeType.Polygon; } })
    points: Array<cc.Vec2> = [];

    @property()
    agent: boolean = false; //碰撞开关

    @property({ type:cc.Integer, visible() { return this.agent; } })
    priority: number = 0; //Agent避让优先级,越大优先级越高

    @property({ visible() { return this.agent; } })
    maxRadius: number = 0; //Agent碰撞半径,小于等于物体体积

    @property({  visible() { return this.agent; } })
    maxVelocity: number = 0; //Agent最大速度,小于等于物体速度
    
    //常用变量
    @property()
    velocity: cc.Vec3 = new cc.Vec3(0, 0, 0); //当前速度

    speed: number = 0; //最大速度
    angle: number = 0; //旋转角度


    isDirty: Dirty = Dirty.RTS;
    shape: cShape = null;
    body: cBody = null;

    onLoad() {

        //创建碰撞形状
        switch (this.type) {
            case ShapeType.Box:
                this.shape = new cBox(this.center, this.size);
                break;
            case ShapeType.Sphere:
                this.shape = new cSphere(this.center, this.radius);
                break;
            case ShapeType.Polygon:
                this.shape = new cPolygon(this.center, this.points);
                break;
        }

        // this.node.is3DNode = true; //全局使用3d坐标系

        //创建碰撞body容器
        this.body = cCollider.inst.create(this);

        this.body.isAgent = this.agent; // agent 检测开关
        this.body.priority = this.priority; //agent 避让优先级
        this.body.neighborDist = this.maxRadius; // agent 体积半径
        this.body.maxVelocity = this.maxVelocity; // agent 最大速度

        this.body.shape = this.shape; //绑定碰撞形状
        this.body.group = 1 << this.node.groupIndex; //碰撞分组
        this.body.mask = MaskBitByGroup(this.node.groupIndex); //碰撞掩码

        //把body加入碰撞管理
        cCollider.inst.insert(this.body);

        this.isDirty = Dirty.RTS;   //首次更新标记

    }


    private _worldScale: cc.Vec3 = new cc.Vec3();
    private _worldRTMat3: cc.Mat3 = new cc.Mat3();
    private _worldMatrix: cc.Mat4 = new cc.Mat4();
    private _worldPosition: cc.Vec3 = new cc.Vec3();
    private _worldRotation: cc.Quat = new cc.Quat();


    get worldScale() {
        this.updateWorldRTS();
        //this.node["getWorldScale"](this._worldScale);
        return this._worldScale;
    }
    get worldPosition() {
        this.updateWorldRTS();
        //this.node["getWorldPosition"](this._worldPosition);
        return this._worldPosition;
    }
    get worldRotation() {
        this.updateWorldRTS();
        //this.node["getWorldRotation"](this._worldRotation);
        return this._worldRotation;
    }

    get worldRotatioMat3() {
        this.updateWorldRTS();
        return this._worldRTMat3;
    }


    //同步瞄点，2D专用
    setAnchor(anchor: cc.Vec2) {

        let c0 = this.center;
        let c1 = this.shape.center;
        this.node.setAnchorPoint(anchor);

        let s = this.node.getContentSize();
        c1.x = (0.5 - anchor.x) * s.width + c0.x;
        c1.y = (0.5 - anchor.y) * s.height + c0.y;

        this.isDirty |= Dirty.T;

    }

    //同步角度2D专用
    setAngle(angle: number) {
        this.node.angle = angle;
        this.isDirty |= Dirty.R;
    }

    getAngle() { return this.node.angle; } //旋转角度2d 专用

    //同步位置到body
    setPosition(position: cc.Vec3) {
        this.node.setPosition(position);
        this.isDirty |= Dirty.T;
    }

    //同步旋转3D专用
    setRotation(rotation: cc.Quat) {
        this.node.setRotation(rotation);
        this.isDirty |= Dirty.R;
    }

    //同步缩放到body
    setScale(scale: cc.Vec3) {
        this.node.setScale(scale);
        this.isDirty |= Dirty.S;
    }

    private _scale: cc.Vec3 = new cc.Vec3();
    private _rotation: cc.Quat = new cc.Quat();
    private _position: cc.Vec3 = new cc.Vec3();
    getRotation() { this.node.getRotation(this._rotation); return this._rotation; }
    getPosition() { this.node.getPosition(this._position); return this._position; }
    getScale() { this.node.getScale(this._scale); return this._scale; }


    //移除node, 是否回收body ？
    remove(retrieve: boolean = true) {

        //移除body,是否回收body
        cCollider.inst.remove(this.body, retrieve);

        //从父节点移除
        this.node.removeFromParent(false);


        //最后node用户自己控制
        //this.remove().destroy() // 马上释放
        //pool.push(this.remove()); //回收复用

        return this.node;
    }

    //重新添加到父节点
    insert(parent: cc.Node) {

        cCollider.inst.insert(this.body, true);
        //添加到父节点
        if (this.node.parent != parent)
            parent.addChild(this.node);
    }

    setAnimation(name: string) { }
    setColor(color: cc.Color) { }
    init() { }

    //trigger 回调 enter,stay exit
    onTrigger(b: cBody, trigger: Trigger) {

        switch (trigger) {
            case Trigger.enter:
                //onTriggerEnter();
                break;
            case Trigger.stay:
                //onTriggerStay();
                break;
            case Trigger.exit:
                //onTriggerExit();
                break;
        }
    }


    onDestroy() {

        this.unscheduleAllCallbacks();
        this.shape = null;
        this.body = null;

    }

    private _updateWorldMatrix (node:any,frameID:number) {
        
        if( node.frameID == frameID ) return node.localDirty;
        node.frameID = frameID;

        let localDirty = 0;
        if (node._parent) {
            localDirty = this._updateWorldMatrix(node._parent,frameID);
        }

        localDirty|= node._localMatDirty;
        let dirty =  node._worldMatDirty;
        if ( dirty ) {
            node._calculWorldMatrix();
            // Sync dirty to children
            let children = node._children;
            for (let i = 0, l = children.length; i < l; i++) {
                children[i]._worldMatDirty = true;
            }
        }

        node.localDirty = localDirty;
        return localDirty;
    }

    updateWorldRTS(force: Dirty = Dirty.NON) {

        this.node['localDirty'] = 0;
        this._updateWorldMatrix( this.node , cc.director.getTotalFrames());
        let localDirty = this.node['localDirty'];
        if( localDirty ){
            if (localDirty & 1) this.isDirty |= Dirty.T;
            if (localDirty & 2) this.isDirty |= Dirty.S;
            if (localDirty & 4) this.isDirty |= Dirty.R;
        }

        // this.isDirty = Dirty.RTS;
        let dirty = this.isDirty | force;

        if( !dirty ) return;
     
        // this.node["_calculWorldMatrix"]();
        const m = this.node["_worldMatrix"].m;

        if (dirty & Dirty.T) {
            const t = this._worldPosition;
            t.x = m[12];
            t.y = m[13];
            t.z = m[14];
        }

        const s = this._worldScale;
        if (dirty & Dirty.S) {
            s.x = Math.sqrt(m[0] * m[0] + m[1] * m[1] + m[2] * m[2]);
            s.y = Math.sqrt(m[4] * m[4] + m[5] * m[5] + m[6] * m[6]);
            s.z = Math.sqrt(m[8] * m[8] + m[9] * m[9] + m[10] * m[10]);
        }

        const m3 = this._worldRTMat3.m;
        if (dirty & Dirty.R) {

            const sx = 1.0 / s.x, sy = 1.0 / s.y, sz = 1.0 / s.z;
            m3[0] = m[0] * sx;
            m3[1] = m[1] * sx;
            m3[2] = m[2] * sx;

            m3[3] = m[4] * sy;
            m3[4] = m[5] * sy;
            m3[5] = m[6] * sy;

            m3[6] = m[8] * sz;
            m3[7] = m[9] * sz;
            m3[8] = m[10] * sz;

            cc.Quat.fromMat3(this._worldRotation, this._worldRTMat3);
        }
    }
}
