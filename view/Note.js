import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

import {Accidental, Dot, OctaveDot, Pitch} from "./Signs.js";
class Note extends React.Component{
    constructor(props){
        super(props);
        this.box = { left : 0, right : 0 }

        this.state = {
            octavePos : {}
        }
    }

    PitchElem(){
        return Elem(Pitch, {key:0, ref:"note", className:"note", pitch:this.props.note.pitch})
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
        // console.log(this.props.note);
        return Elem('span', {style:{}, className:"note"}, [this.PitchElem()].concat(this.DotElem()).concat(this.AccidentalElem()))
    }

    componentDidMount(){
        this.box = this.refs.note.refs.pitch.getBoundingClientRect();
    }
}

export {Note};
