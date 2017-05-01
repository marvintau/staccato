import React from 'react';
import ReactDOM from 'react-dom';

import {Elem, SectionElem, Draw} from "./General.js";

import {Lyric} from "./Lyric.js";

class Vertbar extends React.Component{
    constructor(props){
        super(props);
    }

    render(){

        let bars = [];

        this.props.slot[0].forEach((cell, index) => {
            if(!!cell.pitch){
                bars.push(Elem('span', {key:index > this.props.slot.length/2 ? index + 500 : index , className:"vertbar"}, " "));
            } else {
                bars.push(Elem(Lyric, {lyric:Array(cell.verse.length).fill(" "), key:index+250}));
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

        this.props.slot[0].forEach((cell, index) => {
            if(!!cell.pitch){
                bars.push(Elem('span', {key:index > this.props.slot.length/2 ? index + 500 : index , className:"finalbar"}, " "));
            } else {
                bars.push(Elem(Lyric, {lyric:Array(cell.verse.length).fill(" "), key:index+250}));
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
