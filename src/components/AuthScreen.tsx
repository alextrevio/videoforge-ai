'use client'
import React from 'react'

interface AuthScreenProps {
  onAuth: (user: { id: string; email: string }) => void
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#06060A',fontFamily:"'Sora',sans-serif",padding:20}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');`}</style>
      <div style={{background:'#0C0C12',border:'1px solid #1E1E2A',borderRadius:20,padding:36,width:'100%',maxWidth:400}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:28}}>
          <div style={{width:40,height:40,borderRadius:10,background:'linear-gradient(135deg,#F97316,#EA580C)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>⚡</div>
          <div><div style={{fontSize:20,fontWeight:800,background:'linear-gradient(135deg,#F97316,#FBBF24)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>VideoForge</div><div style={{fontSize:11,color:'#5E5E76'}}>AI Video Automation</div></div>
        </div>
        <h2 style={{fontSize:18,fontWeight:700,color:'#F0F0F5',marginBottom:8}}>Bienvenido</h2>
        <p style={{fontSize:13,color:'#5E5E76',marginBottom:20,lineHeight:1.5}}>Tu plataforma de automatización de video con IA.</p>
        <button style={{width:'100%',padding:'14px 0',borderRadius:10,border:'none',background:'linear-gradient(135deg,#F97316,#EA580C)',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'Sora',sans-serif"}} onClick={()=>onAuth({id:'owner',email:'alejandro@videoforge.ai'})}>Entrar</button>
      </div>
      <div style={{marginTop:24,fontSize:11,color:'#3E3E56'}}>VideoForge AI © 2026</div>
    </div>
  )
}
