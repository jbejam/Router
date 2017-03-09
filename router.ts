export type RequestIn<Params> = {
		params: Params,
		previous: string,
		current: string,
	}
export type RequestOut<Params> = {
	previous: string,
	current: string,
	params: Params;
}
export type Route = {
	onIn: (RequestIn) => Promise<any>;
	onOut?: (RequestOut) => Promise<any>;
	auth?: (previd: string) => boolean;
}
export class Router {
	current: string;
	k: Promise<any>;
	switchMap: {
		[id: string]: Route;
	};
	constructor(intialId: string = "") {
		this.current = intialId;
		this.switchMap = {};
	}
	register(id: string, route: Route) {
		let {
			onIn,
		} = route;
		if ((onIn === undefined && typeof onIn !== 'function')) {
			throw new Error("All switch events (onIn) must be defined.");
		}
		this.switchMap[id] = route;
	}
	authorize(id: string) {
		let rounter = this.switchMap[id];
		if (rounter !== undefined) {
			let auth = rounter.auth;
			if (auth !== undefined) {
				if (typeof auth === 'function' && auth.call(this, id) === false) {
					return false;
				}
			}
		}
		return true;
	}
	routeIn<Params>(id: string, params: Params) {
		let rounter = this.switchMap[id];
		let p = Promise.resolve();
		if (rounter !== undefined) {
			let routeIn = rounter.onIn;
			p = routeIn({
				params: params,
				previous: this.current,
				current: id
			});
		}
		return p;
	}
	routeOut<Params>(id: string, params: Params) {
		let rounter = this.switchMap[id];
		let p = Promise.resolve();
		if (rounter !== undefined) {
			let routeOut = rounter.onOut;
			if (routeOut !== undefined) {
				p = routeOut({
					previous: this.current,
					current: id,
					params: params,
				});
			}
		}
		return p;
	}
	routeTo<ParamsIn, ParamOut>(id: string, reload: boolean = false, paramsin?: ParamsIn, paramsout?: ParamOut) {
		let p = Promise.resolve()
		let last = this.current;
		if (id !== last || reload) {
			if (this.authorize(id)) {
				this.current = id;
				p = this.routeOut(last, paramsout).then(_ => {
					return this.routeIn(id, paramsin);
				})
			}
		}
		return p
	}
}
