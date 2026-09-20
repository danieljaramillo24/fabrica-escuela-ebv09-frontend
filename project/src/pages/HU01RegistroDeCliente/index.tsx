import React, {useState} from "react";
export default (props) => {
	const [input1, onChangeInput1] = useState('');
	const [input2, onChangeInput2] = useState('');
	const [input3, onChangeInput3] = useState('');
	const [input4, onChangeInput4] = useState('');
	return (
		<div className="flex flex-col bg-white">
			<div className="self-stretch bg-slate-100 overflow-hidden">
				<div className="flex justify-between items-center self-stretch bg-white py-5 px-12">
					<img
						src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/Lv4nZvy440/9ltagphy_expires_30_days.png"} 
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
				<div className="flex flex-col items-center self-stretch bg-white py-16">
					<div className="flex flex-col items-start bg-white w-[460px] p-10 gap-5 rounded-xl" 
						style={{
							boxShadow: "0px 8px 24px #0F162812"
						}}>
						<span className="text-slate-900 text-2xl font-bold" >
							Crear cuenta
						</span>
						<span className="text-slate-500 text-sm" >
							Regístrate para gestionar tus citas médicas
						</span>
						<div className="flex flex-col items-start self-stretch bg-white gap-1.5">
							<span className="text-slate-900 text-[13px]" >
								Nombre completo
							</span>
							<input
								placeholder="Ej. Ana María Pérez"
								value={input1}
								onChange={(event)=>onChangeInput1(event.target.value)}
								className="self-stretch text-slate-500 bg-white text-sm py-3 px-3.5 rounded-lg border border-solid border-slate-200"
							/>
						</div>
						<div className="flex flex-col items-start self-stretch bg-white gap-1.5">
							<span className="text-slate-900 text-[13px]" >
								Correo electrónico
							</span>
							<input
								placeholder="nombre@correo.com"
								value={input2}
								onChange={(event)=>onChangeInput2(event.target.value)}
								className="self-stretch text-slate-500 bg-white text-sm py-3 px-3.5 rounded-lg border border-solid border-slate-200"
							/>
						</div>
						<div className="flex flex-col items-start self-stretch bg-white gap-1.5">
							<span className="text-slate-900 text-[13px]" >
								Contraseña
							</span>
							<input
								placeholder="Mínimo 8 caracteres"
								value={input3}
								onChange={(event)=>onChangeInput3(event.target.value)}
								className="self-stretch text-slate-500 bg-white text-sm py-3 px-3.5 rounded-lg border border-solid border-slate-200"
							/>
						</div>
						<div className="flex flex-col items-start self-stretch bg-white gap-1.5">
							<span className="text-slate-900 text-[13px]" >
								Confirmar contraseña
							</span>
							<input
								placeholder="Repite tu contraseña"
								value={input4}
								onChange={(event)=>onChangeInput4(event.target.value)}
								className="self-stretch text-slate-500 bg-white text-sm py-3 px-3.5 rounded-lg border border-solid border-slate-200"
							/>
						</div>
						<button className="flex flex-col items-center self-stretch bg-[#1D6070] text-left py-3.5 rounded-lg border-0"
							onClick={()=>alert("Pressed!")}>
							<span className="text-white text-[15px] font-bold" >
								Crear cuenta
							</span>
						</button>
						<span className="text-[#1D6070] text-[13px]" >
							¿Ya tienes cuenta? Inicia sesión
						</span>
					</div>
				</div>
			</div>
		</div>
	)
}