//程序入口
setImmediate(function () {
    Java.perform(function () {


        hookAllNew("")  //hook该包下的所有函数

        console.log("success ok")

    })

})


// Frida Java hooking helper class.
//
// Edit the example below the HookManager class to suit your
// needs and then run with:
//  frida -U "App Name" -l objchookmanager.js
//
// Generated using objection:
//  https://github.com/sensepost/objection

class JavaHookManager {

    // create a new Hook for clazzName, specifying if we
    // want verbose logging of this class' internals.
    constructor(clazzName, verbose = false) {
        this.printVerbose(`Booting JavaHookManager for ${clazzName}...`);

        this.target = Java.use(clazzName);
        // store hooked methods as { method: x, replacements: [y1, y2] }
        this.hooking = [];
        this.available_methods = [];
        this.verbose = verbose;
        this.populateAvailableMethods(clazzName);
    }

    printVerbose(message) {
        if (!this.verbose) {
            return;
        }
        this.print(`[v] ${message}`);
    }

    print(message) {
        console.log(message);
    }

    // basically from:
    //  https://github.com/sensepost/objection/blob/fa6a8b8f9b68d6be41b51acb512e6d08754a2f1e/agent/src/android/hooking.ts#L43
    populateAvailableMethods(clazz) {
        this.printVerbose(`Populating available methods...`);
        this.available_methods = this.target.class.getDeclaredMethods().map((method) => {
            var m = method.toGenericString();

            // Remove generics from the method
            while (m.includes("<")) {
                m = m.replace(/<.*?>/g, "");
            }

            // remove any "Throws" the method may have
            if (m.indexOf(" throws ") !== -1) {
                m = m.substring(0, m.indexOf(" throws "));
            }

            // remove scope and return type declarations (aka: first two words)
            // remove the class name
            // remove the signature and return
            m = m.slice(m.lastIndexOf(" "));
            m = m.replace(` ${clazz}.`, "");

            return m.split("(")[0];

        }).filter((value, index, self) => {
            return self.indexOf(value) === index;
        });

        this.printVerbose(`Have ${this.available_methods.length} methods...`);
    }
    validMethod(method) {
        if (!this.available_methods.includes(method)) {
            return false;
        }
        return true;
    }

    isHookingMethod(method) {
        if (this.hooking.map(element => {
            if (element.method == method) {
                return true;
            }
            return false;
        }).includes(true)) {
            return true;
        } else {
            return false;
        }
        ;
    }

    hook(m, f = null) {
        if (!this.validMethod(m)) {
            this.print(`Method ${m} is not valid for this class.`);
            return;
        }
        if (this.isHookingMethod(m)) {
            this.print(`Already hooking ${m}. Bailing`);
            return;
        }

        this.printVerbose(`Hookig ${m} and all overloads...`);

        var r = [];
        this.target[m].overloads.forEach(overload => {
            if (f == null) {
                overload.replacement = function () {
                    return overload.apply(this, arguments);
                }
            } else {
                overload.implementation = function () {
                    var ret = overload.apply(this, arguments);
                    return f(arguments, ret);
                }
            }

            r.push(overload);
        });

        this.hooking.push({method: m, replacements: r});
    }

    unhook(method) {
        if (!this.validMethod(method)) {
            this.print(`Method ${method} is not valid for this class.`);
            return;
        }
        if (!this.isHookingMethod(method)) {
            this.print(`Not hooking ${method}. Bailing`);
            return;
        }

        const hooking = this.hooking.filter(element => {
            if (element.method == method) {
                this.printVerbose(`Reverting replacement hook from ${method}`);
                element.replacements.forEach(r => {
                    r.implementation = null;
                });
                return; // effectively removing it
            }
            return element;
        });

        this.hooking = hooking;
    }
}

// SAMPLE Usage:

// var replace = function(args, ret) {
//   // be sure to check the args, you may have an overloaded method
//   console.log('Hello from our new function body!');
//   console.log(JSON.stringify(args));
//   console.log(ret);

//   return ret;
// }


function hookAllTest(classNameS) {
    for (const className of Java.enumerateLoadedClassesSync()) {
        //me.czhd.venus.module.common.ui.SplashCodeActivity
        //me.czhd.venus.module

        // if (className.indexOf("android") != -1){
        //     break
        // }
//&& className.indexOf("me.czhd.venus.base.util.l丨liiI1") ==-1)
        if (className.indexOf(classNameS) != -1) {

            const classA = Java.use(className)
            for (const Methods of classA.class.getDeclaredMethods()) {
                const Method = Methods
                const methodName = encodeURIComponent(Methods.getName())      //对方法名进行一次url编码避免名字存在特殊字符
                let vvc = classA[decodeURIComponent(methodName)].overloads    //拿到该函数的所有方法重载
                for (let ii of vvc) {     //遍历hook所有重载函数
                    ii.implementation = function () {
                        let ret = ii.apply(this, arguments);  // 执行原本逻辑
                        try {
                            const tmp = Method.toString().split(" ");
                            let name = Method.getName(), rec = Method.toString().split("(");
                            name = name + "(" + rec[rec.length - 1]
                            let MethodName = tmp[tmp.length - 2] + " " + name   //通过反射获取函数签名在进行分割处理用于打印
                            console.log(decodeURIComponent(" 被调用的函数信息: " + className + " ==> " + MethodName))
                            console.log("当前对象 " + this)  //打印当前实例信息用于区分实例
                            for (let i of arguments) {
                                console.log("p ==> " + i)     //传入的参数
                            }
                            console.log("r ==> " + ret)       //返回值

                        } catch (e) {
                            console.log("无实例！！！！")
                            printStack()     //打印堆栈
                            return ret
                        }
                        printStack()
                        console.log("success !!!!!")
                        return ret
                    }
                }
            }
        }
    }
}


//hook住该类所有方法并且打印当前对象实例属性和堆栈
//
function hookAllNew(classNameS) {
    for (const className of Java.enumerateLoadedClassesSync()) {
        //me.czhd.venus.module.common.ui.SplashCodeActivity
        //me.czhd.venus.module

        // if (className.indexOf("android") != -1){
        //     break
        // }
        if (className.indexOf(classNameS) != -1) {

            const classA = Java.use(className)
            for (const Methods of classA.class.getDeclaredMethods()) {
                const Method = Methods
                // const methodName = encodeURIComponent(Methods.getName())      //对方法名进行一次url编码避免名字存在特殊字符
                // let vvc = classA[decodeURIComponent(methodName)].overloads    //拿到该函数的所有方法重载
                let vvc = classA[Methods.getName()].overloads   //拿到该函数的所有方法重载
                for (let ii of vvc) {     //遍历hook所有重载函数
                    ii.implementation = function () {
                        let ret = ii.apply(this, arguments);  // 执行原本逻辑
                        try {
                            const tmp = Method.toString().split(" ");
                            let name = Method.getName(), rec = Method.toString().split("(");
                            name = name + "(" + rec[rec.length - 1]
                            let MethodName = tmp[tmp.length - 2] + " " + name   //通过反射获取函数签名在进行分割处理用于打印

                            console.log(" 被调用的函数信息: " + className + " ==> " + MethodName + " url=> " + encodeURIComponent(Method.getName())) //将函数名进行url编码避免有混淆特殊字符
                            console.log("当前对象 " + this)  //打印当前实例信息用于区分实例

                            for (let i of arguments) {
                                console.log("p ==> " + i)     //传入的参数
                            }
                            console.log("r ==> " + ret)       //返回值

                            // console.log("对象属性: ")
                            // const fields = classA.class.getDeclaredFields()
                            // for (let i of fields) {         //通过反射打印当前对象的所有属性
                            //     let field = classA.class.getDeclaredField(i.getName())
                            //     field.setAccessible(true)
                            //     let object = field.get(this)
                            //     console.log("\t" + i.getName() + " ==> " + object)
                            // }
                        } catch (e) {
                            console.log("无实例！！！！")
                            // printStack()     //打印堆栈
                            return ret
                        }
                        // printStack()
                        console.log("============================= ========================================")
                        return ret
                    }
                }
            }
        }
    }
}


//hook住该类的所有方法，并打印堆栈
function hookAll(classNameS) {
    for (const className of Java.enumerateLoadedClassesSync()) {

        // if (className.indexOf("android") != -1){
        //     break
        // }

        if (className.indexOf(classNameS) != -1) {

            const classA = Java.use(className)
            for (const Methods of classA.class.getDeclaredMethods()) {
                const methodName = encodeURIComponent(Methods.getName())
                new JavaHookManager(className).hook(decodeURIComponent(methodName), function (p, r) {
                    console.log("======= " + className + "." + decodeURIComponent(methodName) + " =======")
                    // printStack()
                    for (const i of p) {
                        console.log("p ==> " + i)
                    }
                    console.log("return ==> " + r)
                    printStack()
                    return r
                })

            }
        }
    }
}

//通过反射获取类的所有属性字段和方法,传入的是一个完整的类名
function ClassDump(className) {
    let ClassObject = Java.use(className);
    const fields = ClassObject.class.getDeclaredFields();
    const methods = ClassObject.class.getDeclaredMethods();

    var methodStatic = new Array()
    var methodInstance = new Array()

    console.log("\n" + "ClassName  " + className)

    console.log("\t" + "/* instance fields */")
    for (let fi of fields) {
        console.log("\t" + fi.toString() + ";");
    }
    for (let methodX of methods) {
        if (methodX.toString().indexOf("static") != -1) {
            methodStatic.push(methodX)
            continue
        }
        methodInstance.push(methodX)
    }
    console.log()
    let constructors = ClassObject.class.getDeclaredConstructors();
    console.log("\t" + "/* constructor methods */")
    for (let con of constructors) {
        console.log("\t" + con.toString())
    }


    console.log()
    console.log("\t" + "/* static methods */")
    for (let method of methodStatic) {
        const tmp = method.toString().split(" ");
        let name = method.getName(), rec = method.toString().split("(");
        name = name + "(" + rec[rec.length - 1]
        console.log("\t" + tmp[tmp.length - 2] + " " + name)
    }
    console.log()
    console.log("\t" + "/* instance fields */")
    for (let method of methodInstance) {
        let tmp = method.toString().split(" ")
        let name = method.getName()
        let rec = method.toString().split("(")
        name = name + "(" + rec[rec.length - 1]
        console.log("\t" + tmp[tmp.length - 2] + " " + name)

    }


}

//打印对象的所有属性,传入的是一个完整的类名，该函数会在内存中枚举出所有构建的对象实例
function ObjectDump(className) {

    Java.choose(className, {
        onMatch: function (instance) {
            console.log(instance.toString())

            const fields = instance.getClass().getDeclaredFields()
            for (let i of fields) {
                let field = instance.getClass().getDeclaredField(i.getName())
                field.setAccessible(true)
                let object = field.get(instance)
                console.log("\t" + i.getName() + " ==> " + object.toString())
            }


            // let instanceClass = instance.class
            // let field = instanceClass.getDeclaredField("name")
            // field.setAccessible(true)
            // let object =field.get(instance)
            //
            // // let str = object.valueOf().substring(2)
            // // console.log("私有属性 "+object.valueOf().hashCode())
            //
            // let str = Java.cast(object,Java.use("java.lang.String"))
            //
            // console.log(str.length())

        }, onComplete: function () {
            console.log("success!!!")
        }


    })


}

//通过反射获取实例属性
function getReflectFields(val1) {
    var clazz = Java.use("java.lang.Class");
    var parametersTest = Java.cast(val1.getClass(), clazz);
    //getDeclaredFields()获取所有字段
    var fields = parametersTest.getDeclaredFields();
    fields.forEach(function (field) {//依次打印字段的类型、名称、值
        send("field type is: " + (field.getType()));
        send("field name is: " + (field.getName()));
        send("field value is: " + field.get(val1));
    })
}

//打印堆栈
function printStack() {
    let ExceptionClass = Java.use("java.lang.Exception")
    let LogClass = Java.use("android.util.Log")
    console.log("===============================")
    console.log(LogClass.getStackTraceString(ExceptionClass.$new()))
    console.log("===============================")
}
