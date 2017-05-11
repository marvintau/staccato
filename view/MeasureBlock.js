import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

import {Beat} from "./Beat.js";

import {Vertbar, Repeatbar, Finalbar} from "./Bars.js";

import {Measure} from "./Measure.js";

class MeasureBlock extends React.Component{
    constructor(props){
        super(props);
        this.blockBox = {};
    }

    MeasureElems(){
        
        if(this.props.measure.constructor === Array){
            return this.props.measure.map((measurePart, index) => {
                return Elem(Measure, {ref:"measure-"+index, measure: measurePart, key:index, style:"measure-inner"});
            })
        } else {
            return Elem(Measure, {ref:"measure-"+this.props.index, measure: this.props.measure, key:this.props.index, style:"measure-inner"});
        }

    }

    render() {
        return Elem('div', {style:{}, ref:"block", className:"measure-block"}, this.MeasureElems());
    }

    componentDidMount(){
        this.blockBox = this.refs.block.getBoundingClientRect();
    }

}

export {MeasureBlock};
