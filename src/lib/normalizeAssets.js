// src/lib/normalizeAsset.js

export const normalizeAsset = (asset) => {
  return {
    ...asset,
    assetType: asset.asset_type || asset.assetType,
    warrantyEnd: asset.warranty_end || asset.warrantyEnd,
    ipMacAddress: asset.ip_mac_address || asset.ipMacAddress,
    officeKey: asset.office_key || asset.officeKey,
  };
};

export const normalizeAssets = (assetsArray) => {
  if (!Array.isArray(assetsArray)) return [];
  return assetsArray.map(normalizeAsset);
};