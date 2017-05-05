
{
    let noteCounter = 0;
    let tieOpen = null;
}

Sections "all sections"
= _ sections:Section* {
    return sections
}

Section "section that contains different info"
=  "chorus" _ part:[a-zA-Z]+ _ "{" measures:Measure* "}" _ {

    let ties = ([].concat.apply([], measures.map(measure => measure.ties)))
    let underbars = ([].concat.apply([], measures.map(measure => measure.underbars).filter(underbars => underbars.length>0)));

    measures.forEach(measure =>{
        delete measure.ties;
        delete measure.underbars;
    })

    return {
        name : "chorus",
        part : part.join(""),
        content : { measures: measures,
                    ties : ties,
                    underbars :underbars
                }
    };
}
/ "verse" _ verseNumber:[0-9]+ _ '{' _ lyric:([^ \t\n\r\}]+ _)* '}' _ {
    return {
        name : "verses",
        number : parseInt(verseNumber),
        verses : lyric.map(l => l[0].join(""))
    };
}
/ "verse" _ verseNumber:[0-9]+ _ part:[a-zA-Z]+ _ '{' _ lyric:([^ \t\n\r\}]+ _)* '}' _ {
    return {
        name : "verses",
        part : part.join(""),
        number : parseInt(verseNumber),
        verses : lyric.map(l => l[0].join(""))
    };
}
/ "parts" _ '{' _ parts:([a-zA-Z]+ _)* '}' _ {
    return {
        name : "parts",
        parts : parts.map(elem => elem[0].join(""))
    };
}
/ "phony" _ '{' _ content:[a-zA-Z]+ _ '}' _ {
    return {
        name : "phony",
        phony : content.join("")
    };
}
/ section:[a-zA-Z]+ _ '{' _ content:[^\}]* '}' _ {
    return {
        literal : true,
        name : section.join(""),
        content : content.join("")
    }
}

Measure "measure"
= notes:Notes _ bar:MeasureBar _ {

    let beatRanges = []
    notes.forEach(note => {
        if(note.dotted){
            beatRanges.push(note.notes[0].index);
            beatRanges.push(note.notes[1].index);
        } else {
            beatRanges.push(note.underbar ? note.underbar : note.index)
        }
    });

    let underbars = notes.map(note => note.underbar).filter(underbar => !!underbar);

    let ties = notes.map(note => note.tie).filter(tie => !!tie)

    return {
        beats : notes,
        beatRanges : beatRanges,
        underbars : underbars,
        ties : ties,
        type : bar.type
    }
}

Notes "notes"
= _ first:Note rest:(_ Note)* _{

    var all = [first];

    for(let i = 0; i < rest.length; i ++){
        all.push(rest[i][1]);
    }

    return all;
}

Note "note"
= note:FixedNote _ {
    return note;
}
/ halfed:HalfedNote {
    return halfed;
}
/ dotted:DottedNote {
    return dotted;
}

HalfedNote "duration"
="(" _ notes:(Note _)+ ")" {

    // 去掉空格，并确保不超过三个
    let p = notes.map(note => note[0]);
    p.forEach(note => note.duration = 1/notes.length);

    // 获得下划线的起止位置
    let startIndex = p[0].underbar ? p[0].underbar.start : p[0].index;
    let endIndex = p[p.length - 1].underbar ? p[p.length - 1].underbar.end : p[p.length-1].index;

    // 获得下划线的位置（第几行），它的高度总应该低于（实际在谱
    // 中是高于）高度最低的下划线
    let level = 0;
    for(var n of p){
        if(!!n.underbar && n.underbar.level > level){
            level = n.underbar.level;
        }
    }
    level += 1;

    // 三连音，但是还没有实现
    let upperTuplet;
    if(p.length > 2){
        upperTuplet = {start:startIndex, end:endIndex};
    }

    return {
        notes: p,
        underbar : {start:startIndex, end:endIndex, level:level}
    }
}

DottedNote "dotted"
= "." first:FixedNote _ next:FixedNote {

    first.dotted = true;

    return {
        notes : [first, next],
        dotted: true,
        underbar : {start:next.index, end:next.index},
        factor : 1
    }
}

FixedNote "fixed"
= "/" note:ModifiedPitch _ {

    note.duration = 1;
    note.index = noteCounter++;

    tieOpen = note.index;

    return note;
}

/ note:ModifiedPitch "\\" _ {
    note.duration = 1;
    note.index = noteCounter++;

    if(tieOpen){
        // console.log({start: tieOpen, end:note.index})
        note.tie = {start: tieOpen, end:note.index}
        tieOpen = null;
    }

    return note;
}
/ note:ModifiedPitch _ {
    note.duration = 1;
    note.index = noteCounter++;
    return note
}


ModifiedPitch "modified_pitch"
= acc:Accidental pitch:Pitch octave:Octave {
    pitch.accidental = acc;
    pitch.octave = octave;
    return pitch;
}
/ acc:Accidental pitch:Pitch {
    pitch.accidental = acc;
    return pitch;
}

/ pitch:Pitch octave:Octave {
    pitch.octave = octave;
    return pitch
}
/ pitch:Pitch {
    return pitch
}

Octave "octave"
= [,'][1-3] {

    return (text()[0] == ',') ? - parseInt(text()[1]) : parseInt(text()[1])

}

Accidental "accidental"
= [b#n] {
    return text();
}

Pitch "pitch"
= [0-7] {
    return {pitch : parseInt(text())};
}
/ "-" {
    return {pitch : "–"}
}
/ pitch:[a-zA-Z89]+ {
    console.log('invalid pitch found: ' + pitch);
    return {pitch : "X"}
}

MeasureBar "measure bar"
= "||" _ {
    return {type : "fin"}
}
/ "\:|" _ {
    return {type : "rep_fin"}
}
/ "|\:" _ {
    return {type : "rep_start"}
}
/ "|" _ {
    return {type : "normal"}
}


_ "whitespace"
= [ \t\n\r]*
