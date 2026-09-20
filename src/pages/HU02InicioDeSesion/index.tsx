import React, {useState} from "react";
export default (props) => {
	const [input1, onChangeInput1] = useState('');
	const [input2, onChangeInput2] = useState('');
	return (
		<div className="flex flex-col bg-white">
			<div className="self-stretch bg-slate-100 overflow-hidden">
				<div className="flex justify-between items-center self-stretch bg-white py-5 px-12">
					<img
						src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/Lv4nZvy440/qbb2en9y_expires_30_days.png"} 
						className="w-[81px] h-[81px] object-fill"
					/>
					<div className="flex shrink-0 items-center bg-white gap-[27px]">
						<span className="text-slate-500 text-sm" >
							Especialidades
						</span>
						<span className="text-slate-500 text-sm" >
							Mis citas
						</span>
						<span className="text-slate-500 text-sm" >
							Ayuda
						</span>
					</div>
				</div>
				<div className="flex flex-col items-center self-stretch bg-white py-24">
					<div className="flex flex-col items-start bg-white w-[460px] p-10 gap-5 rounded-xl" 
						style={{
							boxShadow: "0px 8px 24px #0F162812"
						}}>
						<span className="text-slate-900 text-2xl font-bold" >
							Iniciar sesión
						</span>
						<span className="text-slate-500 text-sm" >
							Accede a las funciones de la plataforma
						</span>
						<div className="flex flex-col items-start self-stretch bg-white gap-1.5">
							<span className="text-slate-900 text-[13px]" >
								Correo electrónico
							</span>
							<input
								placeholder="nombre@correo.com"
								value={input1}
								onChange={(event)=>onChangeInput1(event.target.value)}
								className="self-stretch text-slate-500 bg-white text-sm py-3 px-3.5 rounded-lg border border-solid border-slate-200"
							/>
						</div>
						<div className="flex flex-col items-start self-stretch bg-white gap-1.5">
							<span className="text-slate-900 text-[13px]" >
								Contraseña
							</span>
							<input
								placeholder="Tu contraseña"
								value={input2}
								onChange={(event)=>onChangeInput2(event.target.value)}
								className="self-stretch text-slate-500 bg-white text-sm py-3 px-3.5 rounded-lg border border-solid border-slate-200"
							/>
						</div>
						<span className="text-[#1D6070] text-[13px]" >
							¿Olvidaste tu contraseña?
						</span>
						<button className="flex flex-col items-center self-stretch bg-[#1D6070] text-left py-3.5 rounded-lg border-0"
							onClick={()=>alert("Pressed!")}>
							<span className="text-white text-[15px] font-bold" >
								Iniciar sesión
							</span>
						</button>
						<span className="text-[#1D6070] text-[13px]" >
							¿No tienes cuenta? Regístrate
						</span>
					</div>
				</div>
			</div>
		</div>
	)
}