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

    MeasureBarElem(type, index, slot){
        let elem;
        if(type == "normal"){
            elem = [Elem(Vertbar, {key:5300+index-1, slot:slot })]
        } else if (type == "rep_start"){
            elem = [Elem(Repeatbar, {key:5300+index-1, direction:"open", slot:slot })]
        } else if (type == "rep_fin"){
            elem = [Elem(Repeatbar, {key:5300+index-1, direction:"close", slot:slot })]
        } else if (type == "fin"){
            elem = [Elem(Vertbar, {key:5300+index-1, slot:slot }),
                    Elem(Finalbar, {key:6300, slot:slot })]
        }

        return elem;
    }

    BeatElems(){

        return this.props.measure.beats
            .map((slots, index)=>Elem(Beat, {slots:slots, key : index, ref : "beat-" + index}))
            .concat(this.MeasureBarElem(this.props.measure.type, this.props.index, this.props.measure.beats[0]))
    }

    render() {
        return Elem('div', {style:{}, ref:"measure", className:"measure"}, this.BeatElems());
    }

    componentDidMount(){
        this.box = this.refs.measure.getBoundingClientRect();
    }
}

export {Measure};
