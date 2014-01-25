/* Copyright 2012 Perttu Ahola */

var __tmp = function(){
var M = {}
noise_module = M

M.NOISE_MAGIC_X = 1619
M.NOISE_MAGIC_Y = 31337
M.NOISE_MAGIC_Z = 52591
M.NOISE_MAGIC_SEED = 1013

M.dotProduct = function(vx, vy, wx, wy){
    return vx*wx+vy*wy
}
 
M.easeCurve = function(t){
    return 6*Math.pow(t,5)-15*Math.pow(t,4)+10*Math.pow(t,3)
}
 
M.linearInterpolation = function(x0, x1, t){
    return x0+(x1-x0)*t
}
 
M.biLinearInterpolation = function(x0y0, x1y0, x0y1, x1y1, x, y){
    var tx = M.easeCurve(x)
    var ty = M.easeCurve(y)
	/*var tx = x
	var ty = y;*/
    var u = M.linearInterpolation(x0y0,x1y0,tx)
    var v = M.linearInterpolation(x0y1,x1y1,tx)
    return M.linearInterpolation(u,v,ty)
}

M.noise2d = function(x, y, seed)
{
	var n = (M.NOISE_MAGIC_X * x + M.NOISE_MAGIC_Y * y
			+ M.NOISE_MAGIC_SEED * seed) & 0x7fffffff
	n = (n>>13)^n
	n = (n * ((((n*n)%0x100000000)*60493+19990303)%0x100000000) + 1376312589) & 0x7fffffff
	return 1.0 - 1.0*n/1073741824
}

M.noise2d_gradient = function(x, y, seed)
{
	// Calculate the integer coordinates
	var x0 = Math.floor(x)
	var y0 = Math.floor(y)
	// Calculate the remaining part of the coordinates
	var xl = x - x0
	var yl = y - y0
	// Get values for corners of cube
	var v00 = M.noise2d(x0, y0, seed)
	var v10 = M.noise2d(x0+1, y0, seed)
	var v01 = M.noise2d(x0, y0+1, seed)
	var v11 = M.noise2d(x0+1, y0+1, seed)
	// Interpolate
	return M.biLinearInterpolation(v00,v10,v01,v11,xl,yl)
}

M.noise2d_perlin = function(x, y, seed, octaves, persistence)
{
	var a = 0
	var f = 1.0
	var g = 1.0
	var i
	for(i=0; i<octaves; i++)
	{
		a += g * M.noise2d_gradient(x*f, y*f, seed+i)
		f *= 2.0
		g *= persistence
	}
	return a
}

M.noise2d_perlin_abs = function(x, y, seed, octaves, persistence)
{
	var a = 0
	var f = 1.0
	var g = 1.0
	var i
	for(i=0; i<octaves; i++)
	{
		a += g * Math.abs(M.noise2d_gradient(x*f, y*f, seed+i))
		f *= 2.0
		g *= persistence
	}
	return a
}

if(typeof exports !== "undefined"){
	for(var name in M){
		exports[name] = M[name]
	}
}
}()
