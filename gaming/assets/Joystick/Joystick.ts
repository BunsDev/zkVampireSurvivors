
const { ccclass, property } = cc._decorator;


@ccclass
export class Joystick extends cc.Component {

    @property(cc.Node)
    round: cc.Node = null;//摇杆背景

    @property(cc.Node)
    inner: cc.Node = null;//摇杆 也就是中心点

    @property
    isStatic: boolean = true; //固定罗盘不隐藏

    @property
    isDiretion: boolean = false; //是否为方向模式(中心指示点拉尽)

    @property
    maxRadius: number = 128;

    @property
    activeRange: number = 0.1; //摇杆触发范围比例（0-1）

    private joystickCB: Function | null = null;

    public touchID: number | null = -1;


    start() {

        this.show(this.isStatic);
        if (this.isStatic) {
            this.round.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
            this.round.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
            this.round.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
            this.round.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
        } else {

            this.node.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
            this.node.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
            this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
            this.node.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        }

    }

    init(cb: Function) {
        this.joystickCB = cb;
    }

    show(flag: boolean) {
        this.round.active = flag;
    }


    innerPosition(pos: cc.Vec2) {

        let data = { type: null, active: true, angle: 0, ratio: 0 }

        let s = this.node.convertToNodeSpaceAR(new cc.Vec3(pos.x, pos.y));
        s.subtract(this.round.position);

        //触发范围
        if (s.len() <= this.maxRadius * this.activeRange) {
            this.inner.position = new cc.Vec3();
            data.active = false;
            return data;
        }

        //限制范围
        if (s.len() > this.maxRadius || this.isDiretion) {
            s = s.normalizeSelf();
            s = s.multiplyScalar(this.maxRadius);
        }

       // this.inner.position = new cc.Vec3(s); 
       this.inner.position = s; //修正位置

        //实际数据
        data.active = true;
        data.angle = Math.atan2(s.y, s.x);
        data.ratio = s.len() / this.maxRadius; 


        return data;
    }


    touchStart(event: cc.Event.EventTouch) {

        if (this.touchID == -1) {
            this.touchID = event.getID();

            if (!this.isStatic) {
                this.show(true);
                let pos = event.getLocation();
            
                let s = this.node.convertToNodeSpaceAR(new cc.Vec3(pos.x, pos.y));
                this.round.position = s;
                this.inner.setPosition(cc.Vec3.ZERO);
      
                //this.node.setWorldPosition(new cc.Vec3(pos.x, pos.y, 0));
            }
        }


        if (this.touchID != event.getID()) return false;
        let data: any = this.innerPosition(event.getLocation());
        data.type = cc.Node.EventType.TOUCH_START;
        this.joystickCB && this.joystickCB(data);

        return true;
    }

    touchMove(event: cc.Event.EventTouch) {
        if (this.touchID != event.getID()) return false;
        let data: any = this.innerPosition(event.getLocation());
        data.type =  cc.Node.EventType.TOUCH_MOVE;
        this.joystickCB && this.joystickCB(data);

        return true;
    }


    touchEnd(event: cc.Event.EventTouch) {//摇杆弹回原位置
        if (this.touchID != event.getID()) return false;

        this.touchID = -1;
        this.show(this.isStatic);

        this.inner.position = new cc.Vec3();
        let data = { type:  cc.Node.EventType.TOUCH_END, active: false, angle: 0, ratio: 0 }
        this.joystickCB && this.joystickCB(data);

        return true;
    }

}