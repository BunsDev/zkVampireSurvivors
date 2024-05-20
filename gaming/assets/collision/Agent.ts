import { cBody } from "./Body";
import { Line, RVOMath, Vector2 } from "./Maths";

export class ObserverObj<T>{
    public value: T;

    constructor(val?: T)
    {
        if (val)
            this.value = val;
    }
}

export class KeyValuePair<K, V>{
    public Key: K;
    public Value: V;

    constructor(key: K, value: V)
    {
        this.Key = key;
        this.Value = value;
    }
}

export class RVOConfig
{
    /**代理对象总数 */
    public static agentCount = 10;
    /**代理对象之间的距离 */
    public static neighborDist = 0.75;//25;
    /**代理对象的半径 */
    public static radius = 0.5;//10;
    /**代理对象的最大移动速度 */
    public static maxSpeed = 1;
    /**代理对象的初始速度 */
    public static velocity:cc.Vec3 = new cc.Vec3();
    /**最大邻居数 */
    public static maxNeighbors = 10;
    
    /**安全单位时间，值越大，就会越早做出避让行为 */
    public static timeHorizon = 5; //25;

    /**与timeHorizon类似，只针对障碍物 */
    public static timeHorizonObst = 0;

    /**步骤帧 */
    public static timeStep = 0.05;//0.25
}



export class Agent {

    private static _inst: Agent = null;
    static get inst() {
        if (this._inst == null) {
            this._inst = new Agent();
        }
        return this._inst;
    }

    check(a: cBody, b: cBody) {

        let invTimeHorizon = 1.0/RVOConfig.timeHorizon;
        let relativePosition = Vector2.subtract(b.getCenter(), a.getCenter());
        let relativeVelocity = Vector2.subtract(a.newVelocity, b.newVelocity);
        let combinedRadius = a.neighborDist + b.neighborDist;
        let combinedRadiusSq = RVOMath.sqr(combinedRadius);
        let distSq = RVOMath.absSq(relativePosition);

     
        let u = new Vector2();
        let direction = new Vector2();

        if (distSq > combinedRadiusSq)
        {
            let w = Vector2.subtract(relativeVelocity, Vector2.multiply2(invTimeHorizon, relativePosition));
            let wLengthSq = RVOMath.absSq(w);
            let dotProduct1 = Vector2.multiply(w, relativePosition);

            if (dotProduct1 < 0 && RVOMath.sqr(dotProduct1) > combinedRadiusSq * wLengthSq)
            {
                let wLength = RVOMath.sqrt(wLengthSq);
                let unitW = Vector2.division(w, wLength);
                direction = new Vector2(unitW.y, -unitW.x);
                u = Vector2.multiply2(combinedRadius * invTimeHorizon - wLength, unitW);
            } else
            {
                let leg = RVOMath.sqrt(distSq - combinedRadiusSq);
                if (RVOMath.det(relativePosition, w) > 0)
                {
                    direction = Vector2.division(new Vector2(relativePosition.x * leg - relativePosition.y * combinedRadius, relativePosition.x * combinedRadius + relativePosition.y * leg), distSq);
                } else
                {
                    direction = Vector2.division(new Vector2(relativePosition.x * leg + relativePosition.y * combinedRadius, -relativePosition.x * combinedRadius + relativePosition.y * leg), -distSq);
                }

                let dotProduct2 = Vector2.multiply(relativeVelocity, direction);
                u = Vector2.subtract(Vector2.multiply2(dotProduct2, direction), relativeVelocity);
            }
        } else
        {
            let invTimeStep = 1.0/RVOConfig.timeStep;
            let w = Vector2.subtract(relativeVelocity, Vector2.multiply2(invTimeStep, relativePosition));
            let wLength = RVOMath.abs(w);
            let unitW = Vector2.division(w, wLength);

            direction = new Vector2(unitW.y, -unitW.x);
            u = Vector2.multiply2(combinedRadius * invTimeStep - wLength, unitW);
        }

        let lineA = new Line();
        lineA.direction = new Vector2(direction.x,direction.y);
        lineA.point = Vector2.addition(a.newVelocity, Vector2.multiply2(0.5, u));
        a.orcaLines.push(lineA);
    }


    process(bodys:Array<cBody>) {

        for (let i = 0, j = bodys.length; i < j; i++) {
            let body = bodys[i];
            if(body.isAgent && body.orcaLines.length > 0){
                if(!body.isRemove && body.object){
                    let numObstLines = 0; //默认0wh
                    let tempVelocity_ = new ObserverObj<Vector2>(new Vector2(body.newVelocity.x, body.newVelocity.y));
                    let lineFail = this.linearProgram2(body.orcaLines, body.maxVelocity, body.prefVelocity, false, tempVelocity_);
                    if (lineFail < body.orcaLines.length)
                    {
                        this.linearProgram3(body.orcaLines, numObstLines, lineFail, body.maxVelocity, tempVelocity_);
                    }
                
                    let value = tempVelocity_.value;
                    body.prefVelocity.x = body.newVelocity.x;
                    body.prefVelocity.y = body.newVelocity.y;
                    // body.newVelocity.x = value.x;
                    // body.newVelocity.y = value.y;
                  
                    if(body.object){
                        let v = body.object.velocity;
                        v.x = value.x;
                        v.y = value.y;
                        v.z = 0;
                    }
                }
                body.orcaLines.length = 0;
            }
        }
    }


    private linearProgram1(lines: Array<Line>, lineNo: number, radius: number, optVelocity: Vector2, directionOpt: boolean, result: ObserverObj<Vector2>): boolean
    {
        let dotProduct = Vector2.multiply(lines[lineNo].point, lines[lineNo].direction);
        let discriminant = RVOMath.sqr(dotProduct) + RVOMath.sqr(radius) - RVOMath.absSq(lines[lineNo].point);

        if (discriminant < 0)
        {
            return false;
        }

        let sqrtDiscriminant = RVOMath.sqrt(discriminant);
        let tLeft = -dotProduct - sqrtDiscriminant;
        let tRight = -dotProduct + sqrtDiscriminant;

        for (let i = 0; i < lineNo; ++i)
        {
            let denominator = RVOMath.det(lines[lineNo].direction, lines[i].direction);
            let numerator = RVOMath.det(lines[i].direction, Vector2.subtract(lines[lineNo].point, lines[i].point));

            if (RVOMath.fabs(denominator) <= RVOMath.RVO_EPSILON)
            {
                if (numerator < 0)
                {
                    return false;
                }
                continue;
            }

            let t = numerator / denominator;

            if (denominator > 0)
            {
                tRight = Math.min(tRight, t);
            } else
            {
                tLeft = Math.max(tLeft, t);
            }

            if (tLeft > tRight)
            {
                return false;
            }
        }

        if (directionOpt)
        {
            if (Vector2.multiply(optVelocity, lines[lineNo].direction) > 0)
            {
                result.value = Vector2.addition(lines[lineNo].point, Vector2.multiply2(tRight, lines[lineNo].direction));
            } else
            {
                result.value = Vector2.addition(lines[lineNo].point, Vector2.multiply2(tLeft, lines[lineNo].direction));
            }
        } else
        {
            let t = Vector2.multiply(lines[lineNo].direction, Vector2.subtract(optVelocity, lines[lineNo].point));
            if (t < tLeft)
            {
                result.value = Vector2.addition(lines[lineNo].point, Vector2.multiply2(tLeft, lines[lineNo].direction));
            } else if (t > tRight)
            {
                result.value = Vector2.addition(lines[lineNo].point, Vector2.multiply2(tRight, lines[lineNo].direction));
            } else
            {
                result.value = Vector2.addition(lines[lineNo].point, Vector2.multiply2(t, lines[lineNo].direction));
            }
        }

        return true;
    }

    private linearProgram2(lines: Array<Line>, radius: number, optVelocity: Vector2, directionOpt: boolean, result: ObserverObj<Vector2>): number
    {
        if (directionOpt)
        {
            result.value = Vector2.multiply2(radius, optVelocity);
        } else if (RVOMath.absSq(optVelocity) > RVOMath.sqr(radius))
        {
            result.value = Vector2.multiply2(radius, RVOMath.normalize(optVelocity));
        } else
        {
            result.value = optVelocity;
        }

        for (let i = 0; i < lines.length; ++i)
        {
            if (RVOMath.det(lines[i].direction, Vector2.subtract(lines[i].point, result.value)) > 0)
            {
                let tempResult = new Vector2(result.value.x, result.value.y);
                if (!this.linearProgram1(lines, i, radius, optVelocity, directionOpt, result))
                {
                    result.value = tempResult;
                    return i;
                }
            }
        }

        return lines.length;
    }

    private linearProgram3(lines: Array<Line>, numObstLines: number, beginLine: number, radius: number, result: ObserverObj<Vector2>)
    {
        let distance = 0;
        for (let i = beginLine; i < lines.length; ++i)
        {
            if (RVOMath.det(lines[i].direction, Vector2.subtract(lines[i].point, result.value)) > distance)
            {
                let projLines: Array<Line> = [];
                for (let ii = 0; ii < numObstLines; ++ii)
                {
                    projLines[projLines.length] = lines[ii];
                }

                for (let j = numObstLines; j < i; ++j)
                {
                    let line = new Line();
                    let determinant = RVOMath.det(lines[i].direction, lines[j].direction);
                    if (RVOMath.fabs(determinant) <= RVOMath.RVO_EPSILON)
                    {
                        if (Vector2.multiply(lines[i].direction, lines[j].direction) > 0.0)
                        {
                            continue;
                        } else
                        {
                            line.point = Vector2.multiply2(0.5, Vector2.addition(lines[i].point, lines[j].point));
                        }
                    } else
                    {
                        line.point = Vector2.addition(lines[i].point, Vector2.multiply2(RVOMath.det(lines[j].direction, Vector2.subtract(lines[i].point, lines[j].point)) / determinant, lines[i].direction));
                    }

                    let d = Vector2.subtract(lines[j].direction, lines[i].direction);
                    if(RVOMath.absSq(d) > 0){
                        line.direction = RVOMath.normalize(d);
                        projLines[projLines.length] = line;
                    }
                }

                let tempResult = new Vector2(result.value.x, result.value.y);
                if (this.linearProgram2(projLines, radius, new Vector2(-lines[i].direction.y, lines[i].direction.x), true, result) < projLines.length)
                {
                    result.value = tempResult;
                }
                distance = RVOMath.det(lines[i].direction, Vector2.subtract(lines[i].point, result.value));
            }
        }
    }
}




