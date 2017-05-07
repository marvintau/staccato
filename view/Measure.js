import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

import {Beat} from "./Beat.js";

import {Vertbar, Repeatbar, Finalbar} from "./Bars.js";

class Measure extends React.Component{
    constructor(props){
        super(props);
    }

    BeatElems(){

        return this.props.measure.beats
            .map((slots, index)=>Elem(Beat, {slots:slots, key : index, ref : "beat-" + index}))
    }

    render() {
        return Elem('div', {style:{}, className:this.props.style}, this.BeatElems());
    }
}

export {Measure};
