import React from 'react';
import ReactDOM from 'react-dom';
import {Elem, SectionElem, Draw} from "./General.js";

import {Accidental, Dot, OctaveDot, Pitch} from "./Signs.js";
class Note extends React.Component{
    constructor(props){
        super(props);
        this.box = { left : 0, right : 0 }

        this.state = {
            octaveDotPoses : []
        }
    }

    GetOctaveDotPoses(){

        let octaveDotPoses = []
        if(this.props.note.octave && this.props.note.octave.nums){
            let octave = this.props.note.octave;
            for (var i = 0; i < Math.abs(octave.nums); i++) {
                octaveDotPoses.push({
                    index : this.props.note.pitch,
                    left : (this.box.right - this.box.left) / 2,
                    top : octave.nums >= 0
                          ? (-5 * i - this.box.height/2)
                          : (3 * octave.start + 5 * i + this.box.height/2)
                })
            }
        }

        return octaveDotPoses;
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
        ? [Elem(Accidental, {key:205, ref:"acc", acc:this.props.note.accidental})]
        : []
    }

    DotElem(){
        return this.props.note.dotted
        ? [Elem(Dot, {key:204, ref:"dot"})]
        : []
    }

    render(){
        return Elem('span', {style:{}, className:"note"}, [this.PitchElem()].concat(this.DotElem()).concat(this.AccidentalElem()).concat(this.OctaveDotElem()))
    }

    componentDidMount(){
        this.box = this.refs.note.refs.pitch.getBoundingClientRect();

        this.setState({octaveDotPoses: this.GetOctaveDotPoses()})
    }
}

export {Note};