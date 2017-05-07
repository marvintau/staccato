import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

import {Accidental, Dot, OctaveDot, Pitch} from "./Signs.js";
class Note extends React.Component{
    constructor(props){
        super(props);
        this.box = { left : 0, right : 0 }
    }

    PitchElem(){
        return Elem(Pitch, {key:0, ref:"note", className:"note", pitch:this.props.note.pitch})
    }

    OctaveDotElem(){
        return this.state.octaveDotPoses.map((elem, index) =>
            Elem(OctaveDot, {key:1+index, ref:"dot-"+index, pos:elem})
        )
    }

    AccidentalElem(){
        return this.props.note.accidental
        ? [Elem(Accidental, {key:205, acc:this.props.note.accidental})]
        : []
    }

    DotElem(){
        return this.props.note.dotted
        ? [Elem(Dot, {key:204})]
        : []
    }

    render(){
        return Elem('span', {style:{}, className:"note"}, [this.PitchElem()].concat(this.DotElem()).concat(this.AccidentalElem()))
    }

    componentDidMount(){
        this.box = this.refs.note.refs.pitch.getBoundingClientRect();
    }
}

export {Note};
