import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

import {Beat} from "./Beat.js";

import {Vertbar, Repeatbar, Finalbar} from "./Bars.js";

class Measure extends React.Component{
    constructor(props){
        super(props);
        this.notePoses = {}
        this.box = {}
    }

    GetNotePoses(){
        let notePoses = {}

        for(let ithBeat in this.refs){
            if(ithBeat != "measure"){
                let elem = this.refs[ithBeat]
                Object.assign(notePoses, elem.notePoses)
            }
        }

        return notePoses;
    }

    BeatElems(){

        return this.props.measure.beats
            .map((slots, index)=>Elem(Beat, {slots:slots, key : index, ref : "beat-" + index}))
    }

    render() {
        return Elem('div', {style:{}, className:this.props.style}, this.BeatElems());
    }

    componentDidMount(){
        // this.box = this.refs.measure.getBoundingClientRect();
    }
}

export {Measure};
