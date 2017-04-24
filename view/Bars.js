import React from 'react';
import ReactDOM from 'react-dom';

import {Elem, SectionElem, Draw} from "./General.js";

import {Lyric} from "./Lyric.js";

class Vertbar extends React.Component{
    constructor(props){
        super(props);
        console.log(this.props.lyricLines);
    }

    render(){

        let bars = [];

        let center = this.props.parts.length/2 - 1;

        Object.keys(this.props.parts).forEach((_, index) => {
            bars.push(Elem('span', {key:index > center ? index + 500 : index , className:"vertbar"}, " "));
            if(index == center){
                if(this.props.lyric){
                    bars.push(Elem(Lyric, Object.assign(this.props.lyric, {key:index+250})));
                }
                else
                    bars.push(Elem(Lyric, Object.assign([Array(this.props.lyricLines).fill(" ")], {key:index+250})));
            }
        });

        return Elem('div', {className:"vertbars"}, bars);
    }
}

class Finalbar extends React.Component{
    constructor(props){
        super(props);
    }
    render(){

        let bars = [];

        let center = this.props.parts.length/2 - 1;

        Object.keys(this.props.parts).forEach((_, index) => {
            bars.push(Elem('span', {key:index > center ? index + 500 : index , className:"finalbar"}, " "));
            if(index == center){
                if(this.props.lyric){
                    bars.push(Elem(Lyric, Object.assign(this.props.lyric, {key:index+250})));
                }
                else
                    bars.push(Elem(Lyric, Object.assign([Array(this.props.lyricLines).fill(" ")], {key:index+250})));
            }
        });

        return Elem('div', {className:"finalbars"}, bars)
    }
}

class Repeatbar extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        return Elem('span', {className:"repeatbar" + (this.props.initial ? " initialbar" : "")}, [
            Elem('span', {className:"dotUpper", key:42944})
        ])
    }
}

export {Vertbar, Finalbar, Repeatbar};