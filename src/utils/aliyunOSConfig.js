import OSS from 'ali-oss'

export function client(credentials) {
  return new OSS({
    accessKeyId: credentials.accessKeyId,
    accessKeySecret: credentials.accessKeySecret,
    stsToken: credentials.securityToken,
    secure: true,
    region: credentials.region || 'oss-cn-beijing',
    bucket: credentials.bucket || 'mbg-greentea-client'
  })
}
