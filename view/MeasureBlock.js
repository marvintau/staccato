import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

import {Beat} from "./Beat.js";

import {Vertbar, Repeatbar, Finalbar} from "./Bars.js";

import {Measure} from "./Measure.js";

class MeasureBlock extends React.Component{
    constructor(props){
        super(props);
    }

    MeasureElems(){
        return this.props.measure.map((measurePart, index) => {
            return Elem(Measure, {ref:"measure-"+index, measure: measurePart, key:index, style:"measure-inner"});
        })
    }

    render() {
        return Elem('div', {style:{}, className:"measure-block"}, this.MeasureElems());
    }
}

export {MeasureBlock};
