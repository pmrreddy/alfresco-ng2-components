import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import * as program from "commander";

import * as heading from "mdast-util-heading-range";
import * as remark from "remark";

import * as unist from "../unistHelpers";
import { JsxEmit, isClassDeclaration } from "typescript";

export function initPhase(aggData) {
}

export function readPhase(tree, pathname, aggData) {
}

export function aggPhase(aggData) {
}

export function updatePhase(tree, pathname, aggData) {
    let fileNameNoSuffix = path.basename(pathname, ".md");

    if (fileNameNoSuffix.match(/component/)) {
        let srcData = aggData.srcData[fileNameNoSuffix];

        if (srcData) {
            let srcPath = srcData.path;
            let className = fixCompodocFilename(fileNameNoSuffix);
            
            let inputs = [];
            let outputs = [];
            getPropDocData(path.resolve(".", srcPath), className, inputs, outputs);

            let inTable = buildInputsTable(inputs);
            let outTable = buildOutputsTable(outputs);

            if (inTable) {
                heading(tree, "Properties", (before, section, after) => {
                    return [before, inTable, after];
                });
            }

            if (outTable) {
                heading(tree, "Events", (before, section, after) => {
                    return [before, outTable, after];
                });
            }
        }
    }

    return true;
}


function initialCap(str: string) {
    return str[0].toUpperCase() + str.substr(1);
}


function fixCompodocFilename(rawName: string) {
	var name = rawName.replace(/\]|\(|\)/g, '');
	
    var fileNameSections = name.split('.');
    var compNameSections = fileNameSections[0].split('-');
    
    var outCompName = '';
    
    for (var i = 0; i < compNameSections.length; i++) {
        outCompName = outCompName + initialCap(compNameSections[i]);
    }
    
    var itemTypeIndicator = '';
    
    if (fileNameSections.length > 1) {
        itemTypeIndicator = initialCap(fileNameSections[1]);
    }
	
    var finalName = outCompName + itemTypeIndicator;
	
    return finalName;
}


function getPropDocData(srcPath: string, docClassName: string, inputs: any[], outputs: any[]) {
    let prog = ts.createProgram([srcPath], {
        target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
    });

    let sourceFiles = prog.getSourceFiles();
    let checker = prog.getTypeChecker();

    for (var i = 0; i < sourceFiles.length; i++) {
        if (!sourceFiles[i].isDeclarationFile)
            ts.forEachChild(sourceFiles[i], visit);
    }

    function visit(node: ts.Node) {
        if (!isNodeExported(node))
            return;
        
        if (ts.isClassDeclaration(node) && node.name) {
            let classDec: ts.ClassDeclaration = node;
            let sourceFile = classDec.getSourceFile();
    
            if (classDec.name.escapedText === docClassName) {
                getPropDataFromClassChain(checker, classDec, inputs, outputs);
            }
        }
    }
}


// Get properties/events from main class and all inherited classes.
function getPropDataFromClassChain(
    checker: ts.TypeChecker,
    classDec: ts.ClassDeclaration,
    inputs: any[],
    outputs: any[]
){ 
    // Main class
    getPropDataFromClass(checker, classDec, inputs, outputs);

    // Inherited classes
    for(const hc of classDec.heritageClauses) {
        let hcType = checker.getTypeFromTypeNode(hc.types[0]);
        
        console.log(checker.getFullyQualifiedName(hcType.symbol));

        for (const dec of hcType.symbol.declarations) {
            if (isClassDeclaration(dec)) {
                getPropDataFromClassChain(checker, dec, inputs, outputs);
            }
        }
    }

}


function getPropDataFromClass(
    checker: ts.TypeChecker,
    classDec: ts.ClassDeclaration,
    inputs: any[],
    outputs: any[]
){
    let sourceFile = classDec.getSourceFile();

    for (var i = 0; i < classDec.members.length; i++) {
        let member = classDec.members[i];

        if (ts.isPropertyDeclaration(member) ||
            ts.isGetAccessorDeclaration(member) ||
            ts.isSetAccessorDeclaration(member)) {
            let prop: ts.PropertyDeclaration = member;

            let mods = ts.getCombinedModifierFlags(prop);
            let nonPrivate = (mods & ts.ModifierFlags.Private) === 0;
            let memSymbol = checker.getSymbolAtLocation(prop.name);
            
            if (nonPrivate && memSymbol && prop.decorators) {
                let name = memSymbol.getName();
                let initializer = "";
                
                if (prop.initializer) {
                    initializer = prop.initializer.getText(sourceFile);
                }
                
                let doc = ts.displayPartsToString(memSymbol.getDocumentationComment(checker));
                doc = doc.replace(/\r\n/g, " ");
                
                let propType = checker.typeToString(checker.getTypeOfSymbolAtLocation(memSymbol, memSymbol.valueDeclaration!));
                
                let dec = prop.decorators[0].getText(sourceFile);
            
                if (dec.match(/@Input/)) {
                    inputs.push({
                        "name": name,
                        "type": propType,
                        "init": initializer,
                        "docText": doc
                    });
                } else if (dec.match(/@Output/)) {
                    outputs.push({
                        "name": name,
                        "type": propType,
                        "docText": doc
                    });
                }
            }
        }
    }
}


function buildInputsTable(inputs: any[]) {
    if (inputs.length === 0) {
        return null;
    }

    var rows = [
        unist.makeTableRow([
            unist.makeTableCell([unist.makeText("Name")]),
            unist.makeTableCell([unist.makeText("Type")]),
           // unist.makeTableCell([unist.makeText("Default value")]),
            unist.makeTableCell([unist.makeText("Description")])
        ])
    ];
    
    for (var i = 0; i < inputs.length; i++) {
        var pName = inputs[i].name;
        var pType = inputs[i].type;
        var pDefault = inputs[i].init || "";
        var pDesc = inputs[i].docText || "";

        if (pDesc) {
            //pDesc = pDesc.trim().replace(/[\n\r]+/, " ");
            pDesc = pDesc.replace(/[\n\r]+/, " ");
        }

        var descCellContent = remark().parse(pDesc).children;

        if (pDefault) {
            descCellContent.push(unist.makeHTML("<br/>"));
            descCellContent.push(unist.makeText(" Default value: "));
            descCellContent.push(unist.makeInlineCode(pDefault));
        }

        var cells = [
            unist.makeTableCell([unist.makeText(pName)]),
            unist.makeTableCell([unist.makeInlineCode(pType)]),
            //unist.makeTableCell([unist.makeText(pDefault)]),
            unist.makeTableCell(descCellContent)
        ];

        rows.push(unist.makeTableRow(cells));
    }

    return unist.makeTable([null, null, null, null], rows);
}


function buildOutputsTable(outputs: any[]) {
    if (outputs.length === 0) {
        return null;
    }

    var rows = [
        unist.makeTableRow([
            unist.makeTableCell([unist.makeText("Name")]),
            unist.makeTableCell([unist.makeText("Type")]),
            unist.makeTableCell([unist.makeText("Description")])
        ])
    ];
    
    for (var i = 0; i < outputs.length; i++){
        var eName = outputs[i].name;
        var eType = outputs[i].type;
        var eDesc = outputs[i].docText || "";

        if (eDesc) {
            eDesc = eDesc.trim().replace(/[\n\r]+/, ' ');
        }

        var cells = [
            unist.makeTableCell([unist.makeText(eName)]),
            unist.makeTableCell([unist.makeInlineCode(eType)]),
            unist.makeTableCell(remark().parse(eDesc).children)
        ];

        rows.push(unist.makeTableRow(cells));
    }

    return unist.makeTable([null, null, null], rows);
}

function isNodeExported(node: ts.Node): boolean {
    return (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0 || (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile);
}