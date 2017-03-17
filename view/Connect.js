import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

class Connect extends React.Component {
    constructor(props){
        super(props);
    }

    GetSVGCurveText(AX, AY, CAX, CAY, CBX, CBY, BX, BY, thickness){
        return "M" + AX  + " " + AY +
          "C" + CAX + " " + CAY + "," + CBX  + " " + CBY + "," + BX + " " + BY +
          "C" + CBX + " " + (CBY + thickness) + "," + CAX + " " + (CAY + thickness) + "," + AX + " " + AY +
          "Z"
    }

    render(){

        let startX  = this.props.startLeft,
            startY  = this.props.startTop,
            startCX  = this.props.startCLeft,
            startCY  = this.props.startCTop,

            endX    = this.props.endLeft,
            endY    = this.props.endTop,
            endCX    = this.props.endCLeft,
            endCY    = this.props.endCTop,

            fakeStartX = endX - 200,
            fakeEndX = startX + 200,
            fakeStartY = endY,
            fakeEndY = startY,

            fakeStartCX = endCX - 180,
            fakeEndCX = startCX + 180,
            fakeStartCY = endCY,
            fakeEndCY = startCY;

        let elem;
        if (startY == endY) {
            elem = Elem('svg', {
                xmlns:"http://www.w3.org/2000/svg"},
                Elem('path', {
                    d: this.GetSVGCurveText(startX, startY, startCX, startCY, endCX, endCY, endX, endY, 3),
                    fill : "black"
                }
            ))
        } else {
            elem = Elem('svg', {
                xmlns:"http://www.w3.org/2000/svg"},
                Elem('path', {
                    d:  this.GetSVGCurveText(startX, startY, startCX, startCY, fakeEndCX, fakeEndCY, fakeEndX, fakeEndY, 2) +
                        this.GetSVGCurveText(fakeStartX, fakeStartY, fakeStartCX, fakeStartCY, endCX, endCY, endX, endY, 2),
                    fill : "black"
                }
            ))
        }

        return elem
    }
}

export {Connect};